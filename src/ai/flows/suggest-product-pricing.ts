'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting optimal product pricing based on
 * current inventory levels, popularity, and spoilage risk.
 *
 * - suggestProductPricing - A function that handles the product pricing suggestion process.
 * - SuggestProductPricingInput - The input type for the suggestProductPricing function.
 * - SuggestProductPricingOutput - The return type for the suggestProductPricing function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestProductPricingInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  currentStockQty: z.number().describe('The current stock quantity of the product.'),
  popularityScore: z.number().describe('A score representing the popularity of the product (e.g., sales per week).'),
  spoilageRisk: z.string().describe('The spoilage risk of the product (e.g., high, medium, low).'),
  currentPrice: z.number().describe('The current price of the product.'),
});
export type SuggestProductPricingInput = z.infer<typeof SuggestProductPricingInputSchema>;

const SuggestProductPricingOutputSchema = z.object({
  suggestedPrice: z.number().describe('The suggested optimal price for the product.'),
  reasoning: z.string().describe('The reasoning behind the suggested price.'),
});
export type SuggestProductPricingOutput = z.infer<typeof SuggestProductPricingOutputSchema>;

export async function suggestProductPricing(input: SuggestProductPricingInput): Promise<SuggestProductPricingOutput> {
  return suggestProductPricingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestProductPricingPrompt',
  input: {schema: SuggestProductPricingInputSchema},
  output: {schema: SuggestProductPricingOutputSchema},
  prompt: `You are an expert pricing strategist for a restaurant.

  Based on the following information, suggest an optimal price for the product to maximize profits and minimize waste.

  Product Name: {{{productName}}}
  Current Stock Quantity: {{{currentStockQty}}}
  Popularity Score: {{{popularityScore}}}
  Spoilage Risk: {{{spoilageRisk}}}
  Current Price: {{{currentPrice}}}

  Consider the following factors when determining the optimal price:
  - High stock quantity and low popularity may indicate a need to lower the price to increase sales and reduce waste.
  - Low stock quantity and high popularity may indicate a need to increase the price to maximize profits.
  - High spoilage risk may indicate a need to lower the price to sell the product quickly.

  Respond with the suggested price and a brief explanation of your reasoning.
  `,
});

const suggestProductPricingFlow = ai.defineFlow(
  {
    name: 'suggestProductPricingFlow',
    inputSchema: SuggestProductPricingInputSchema,
    outputSchema: SuggestProductPricingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
