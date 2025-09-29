import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function POST(request: NextRequest) {
  try {
    const { budget, size, location, hasParking, hasPets, isWheelchair } = await request.json();

    if (!budget || !size || !location) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const results = await scrapeHousingData({
      budget: parseInt(budget),
      size: parseFloat(size),
      location: location.toLowerCase(),
      hasParking,
      hasPets,
      isWheelchair
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json({ error: 'Failed to scrape housing data' }, { status: 500 });
  }
}

async function scrapeHousingData(params: {
  budget: number;
  size: number;
  location: string;
  hasParking: boolean;
  hasPets: boolean;
  isWheelchair: boolean;
}) {
  const { budget, size, location, hasParking, hasPets, isWheelchair } = params;
  
  // Generate search URLs for different portals
  const searchUrls = generateSearchUrls(budget, size, location, hasParking, hasPets, isWheelchair);
  
  const allResults = [];

  // Scrape each portal
  for (const urlData of searchUrls) {
    try {
      const results = await scrapePortal(urlData);
      allResults.push(...results);
    } catch (error) {
      console.error(`Error scraping ${urlData.portal}:`, error);
      // Continue with other portals even if one fails
    }
  }

  // Sort by match score and return top 3
  return allResults
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);
}

function generateSearchUrls(budget: number, size: number, location: string, hasParking: boolean, hasPets: boolean, isWheelchair: boolean) {
  const city = location.split(',')[0].toLowerCase();
  
  return [
    {
      portal: 'homegate',
      url: `https://www.homegate.ch/mieten/immobilie/${city}/trefferliste?rooms=${size}&price=${budget}&pets=${hasPets}&parking=${hasParking}`,
      selectors: {
        container: '.listing-item',
        title: '.listing-item-title',
        price: '.listing-item-price',
        location: '.listing-item-location',
        link: '.listing-item-title a'
      }
    },
    {
      portal: 'immoscout24',
      url: `https://www.immoscout24.ch/mieten/wohnung/${city}?rooms=${size}&price=${budget}&pets=${hasPets}&parking=${hasParking}`,
      selectors: {
        container: '.result-list-entry',
        title: '.result-list-entry-title',
        price: '.result-list-entry-price',
        location: '.result-list-entry-location',
        link: '.result-list-entry-title a'
      }
    },
    {
      portal: 'newhome',
      url: `https://www.newhome.ch/mieten/wohnung/${city}?rooms=${size}&price=${budget}&pets=${hasPets}&parking=${hasParking}`,
      selectors: {
        container: '.property-item',
        title: '.property-item-title',
        price: '.property-item-price',
        location: '.property-item-location',
        link: '.property-item-title a'
      }
    }
  ];
}

async function scrapePortal(urlData: any) {
  try {
    // Add headers to mimic a real browser
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'de-CH,de;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };

    const response = await axios.get(urlData.url, { 
      headers,
      timeout: 10000 // 10 second timeout
    });

    const $ = cheerio.load(response.data);
    const results = [];

    // Try to find listings using the selectors
    $(urlData.selectors.container).each((index, element) => {
      if (index >= 3) return false; // Limit to 3 results per portal

      try {
        const title = $(element).find(urlData.selectors.title).text().trim();
        const priceText = $(element).find(urlData.selectors.price).text().trim();
        const locationText = $(element).find(urlData.selectors.location).text().trim();
        const linkElement = $(element).find(urlData.selectors.link);
        const link = linkElement.attr('href') || urlData.url;

        if (title && priceText) {
          // Extract price from text (e.g., "CHF 2'500" -> 2500)
          const priceMatch = priceText.match(/CHF\s*([0-9'.,]+)/);
          const price = priceMatch ? parseInt(priceMatch[1].replace(/['.,]/g, '')) : 0;

          // Calculate match score based on price proximity to budget
          const priceDifference = Math.abs(price - urlData.budget);
          const matchScore = Math.max(0, 100 - (priceDifference / urlData.budget) * 100);

          results.push({
            id: `${urlData.portal}-${index}`,
            title: title,
            price: price,
            size: `${urlData.size} rooms`,
            location: locationText || urlData.location,
            features: generateFeatures(urlData.hasParking, urlData.hasPets, urlData.isWheelchair),
            description: `Found on ${urlData.portal.charAt(0).toUpperCase() + urlData.portal.slice(1)} - ${title}`,
            matchScore: Math.round(matchScore),
            availability: 'Available',
            link: link.startsWith('http') ? link : `https://www.${urlData.portal}.ch${link}`,
            portal: urlData.portal
          });
        }
      } catch (error) {
        console.error(`Error parsing listing ${index}:`, error);
      }
    });

    return results;
  } catch (error) {
    console.error(`Error scraping ${urlData.portal}:`, error);
    return [];
  }
}

function generateFeatures(hasParking: boolean, hasPets: boolean, isWheelchair: boolean) {
  const features = ['Modern kitchen', 'Balcony'];
  
  if (hasParking) features.push('Parking included');
  if (hasPets) features.push('Pets allowed');
  if (isWheelchair) features.push('Wheelchair accessible');
  
  return features;
}
