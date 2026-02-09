import { defineCollection, z } from 'astro:content';

const newsCollection = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        pubDate: z.date(),
        image: z.string(),
        summary: z.string(),
        tags: z.array(z.string()),
        author: z.string(),
        featured: z.boolean().default(false),
    }),
});

const cardsCollection = defineCollection({
    type: 'content',
    schema: z.object({
        name: z.string(),
        rarity: z.enum(['Common', 'Rare', 'Epic', 'Legendary', 'Mythic']),
        type: z.string(),
        description: z.string(),
        attack: z.number(),
        defense: z.number(),
        image: z.string(),
    }),
});

const rulesCollection = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        order: z.number(),
        icon: z.string(),
        summary: z.string(),
    }),
});

export const collections = {
    news: newsCollection,
    cards: cardsCollection,
    rules: rulesCollection,
};
