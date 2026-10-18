/**
 * Service de recherche métadonnées par ISBN (Google Books & Open Library)
 * Exécute les requêtes avec un délai maximal strict de 8 secondes.
 * Ne bloque jamais l'interface utilisateur.
 */

export interface IsbnLookupResult {
  titre: string;
  auteur: string;
  editeur: string;
  anneeEdition: number;
  pagination: number;
  resume: string;
  coverUrl?: string;
  sommaire?: string;
}

export async function lookupBookByIsbn(rawIsbn: string): Promise<IsbnLookupResult | null> {
  const cleanIsbn = rawIsbn.replace(/[^0-9X]/gi, '').trim();
  if (cleanIsbn.length !== 10 && cleanIsbn.length !== 13) {
    return null;
  }

  // 1. Interrogation de l'API Google Books (sans clé) avec timeout de 8 secondes
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        const info = data.items[0].volumeInfo;
        const year = info.publishedDate ? parseInt(info.publishedDate.substring(0, 4), 10) : new Date().getFullYear();
        
        let cover = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || info.imageLinks?.medium || info.imageLinks?.large || '';
        if (cover) {
          cover = cover.replace(/^http:\/\//i, 'https://');
        } else {
          cover = `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg?default=false`;
        }

        const authors = info.authors && info.authors.length > 0 ? info.authors.join(', ') : '';

        return {
          titre: info.title ? `${info.title}${info.subtitle ? `: ${info.subtitle}` : ''}` : '',
          auteur: authors,
          editeur: info.publisher || '',
          anneeEdition: !isNaN(year) ? year : new Date().getFullYear(),
          pagination: info.pageCount || 0,
          resume: info.description || '',
          coverUrl: cover
        };
      }
    }
  } catch {
    // Échec ou timeout sur Google Books : continuation vers Open Library
  }

  // 2. Interrogation de l'API Open Library en cas d'absence de résultat
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const bookData = data[`ISBN:${cleanIsbn}`];
      if (bookData) {
        const yearMatch = bookData.publish_date?.match(/\d{4}/);
        const year = yearMatch ? parseInt(yearMatch[0], 10) : new Date().getFullYear();
        const desc = typeof bookData.description === 'string' 
          ? bookData.description 
          : bookData.description?.value || '';

        const cover = bookData.cover?.large || 
          bookData.cover?.medium || 
          bookData.cover?.small || 
          `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg?default=false`;

        return {
          titre: bookData.title || '',
          auteur: bookData.authors ? bookData.authors.map((a: { name: string }) => a.name).join(', ') : '',
          editeur: bookData.publishers ? bookData.publishers.map((p: { name: string }) => p.name).join(', ') : '',
          anneeEdition: !isNaN(year) ? year : new Date().getFullYear(),
          pagination: bookData.number_of_pages || 0,
          resume: desc,
          coverUrl: cover
        };
      }
    }
  } catch {
    // Timeout ou erreur réseau
  }

  return null;
}
