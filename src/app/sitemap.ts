import type { MetadataRoute } from 'next'

const BASE_URL = 'https://tools.orque.co'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${BASE_URL}/fr`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
      alternates: {
        languages: {
          fr: `${BASE_URL}/fr`,
          en: `${BASE_URL}/en`,
        },
      },
    },
    {
      url: `${BASE_URL}/fr/nitrox`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: {
        languages: {
          fr: `${BASE_URL}/fr/nitrox`,
          en: `${BASE_URL}/en/nitrox`,
        },
      },
    },
    {
      url: `${BASE_URL}/fr/convertisseur`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: {
        languages: {
          fr: `${BASE_URL}/fr/convertisseur`,
          en: `${BASE_URL}/en/convertisseur`,
        },
      },
    },
    {
      url: `${BASE_URL}/fr/consommation`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: {
        languages: {
          fr: `${BASE_URL}/fr/consommation`,
          en: `${BASE_URL}/en/consommation`,
        },
      },
    },
    {
      url: `${BASE_URL}/fr/gas-blender`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: {
        languages: {
          fr: `${BASE_URL}/fr/gas-blender`,
          en: `${BASE_URL}/en/gas-blender`,
        },
      },
    },
    {
      url: `${BASE_URL}/fr/etiquette-nitrox`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: {
        languages: {
          fr: `${BASE_URL}/fr/etiquette-nitrox`,
          en: `${BASE_URL}/en/etiquette-nitrox`,
        },
      },
    },
    {
      url: `${BASE_URL}/fr/saturation-azote`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: {
        languages: {
          fr: `${BASE_URL}/fr/saturation-azote`,
          en: `${BASE_URL}/en/saturation-azote`,
        },
      },
    },
    {
      url: `${BASE_URL}/fr/mod`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: {
        languages: {
          fr: `${BASE_URL}/fr/mod`,
          en: `${BASE_URL}/en/mod`,
        },
      },
    },
    {
      url: `${BASE_URL}/fr/ppo2`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: {
        languages: {
          fr: `${BASE_URL}/fr/ppo2`,
          en: `${BASE_URL}/en/ppo2`,
        },
      },
    },
    {
      url: `${BASE_URL}/fr/ead`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: {
        languages: {
          fr: `${BASE_URL}/fr/ead`,
          en: `${BASE_URL}/en/ead`,
        },
      },
    },
    {
      url: `${BASE_URL}/fr/best-mix`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: {
        languages: {
          fr: `${BASE_URL}/fr/best-mix`,
          en: `${BASE_URL}/en/best-mix`,
        },
      },
    },
    {
      url: `${BASE_URL}/fr/lestage`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: {
        languages: {
          fr: `${BASE_URL}/fr/lestage`,
          en: `${BASE_URL}/en/lestage`,
        },
      },
    },
    {
      url: `${BASE_URL}/en`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
      alternates: {
        languages: {
          fr: `${BASE_URL}/fr`,
          en: `${BASE_URL}/en`,
        },
      },
    },
    {
      url: `${BASE_URL}/en/nitrox`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: {
        languages: {
          fr: `${BASE_URL}/fr/nitrox`,
          en: `${BASE_URL}/en/nitrox`,
        },
      },
    },
    {
      url: `${BASE_URL}/en/convertisseur`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: {
        languages: {
          fr: `${BASE_URL}/fr/convertisseur`,
          en: `${BASE_URL}/en/convertisseur`,
        },
      },
    },
    {
      url: `${BASE_URL}/en/consommation`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: {
        languages: {
          fr: `${BASE_URL}/fr/consommation`,
          en: `${BASE_URL}/en/consommation`,
        },
      },
    },
    {
      url: `${BASE_URL}/en/gas-blender`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: {
        languages: {
          fr: `${BASE_URL}/fr/gas-blender`,
          en: `${BASE_URL}/en/gas-blender`,
        },
      },
    },
    {
      url: `${BASE_URL}/en/etiquette-nitrox`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: {
        languages: {
          fr: `${BASE_URL}/fr/etiquette-nitrox`,
          en: `${BASE_URL}/en/etiquette-nitrox`,
        },
      },
    },
    {
      url: `${BASE_URL}/en/saturation-azote`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: {
        languages: {
          fr: `${BASE_URL}/fr/saturation-azote`,
          en: `${BASE_URL}/en/saturation-azote`,
        },
      },
    },
    {
      url: `${BASE_URL}/en/mod`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: {
        languages: {
          fr: `${BASE_URL}/fr/mod`,
          en: `${BASE_URL}/en/mod`,
        },
      },
    },
    {
      url: `${BASE_URL}/en/ppo2`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: {
        languages: {
          fr: `${BASE_URL}/fr/ppo2`,
          en: `${BASE_URL}/en/ppo2`,
        },
      },
    },
    {
      url: `${BASE_URL}/en/ead`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: {
        languages: {
          fr: `${BASE_URL}/fr/ead`,
          en: `${BASE_URL}/en/ead`,
        },
      },
    },
    {
      url: `${BASE_URL}/en/best-mix`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: {
        languages: {
          fr: `${BASE_URL}/fr/best-mix`,
          en: `${BASE_URL}/en/best-mix`,
        },
      },
    },
    {
      url: `${BASE_URL}/en/lestage`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: {
        languages: {
          fr: `${BASE_URL}/fr/lestage`,
          en: `${BASE_URL}/en/lestage`,
        },
      },
    },
  ]
}
