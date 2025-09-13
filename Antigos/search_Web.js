const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

async function buscarResumoWeb(query) {
  let resultadoFinal = '';

  // Lança o navegador
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--disable-http2', '--no-sandbox']
  });

  const page = await browser.newPage();
  const encodedQuery = encodeURIComponent(query);
  const duckDuckGoUrl = `https://duckduckgo.com/?q=${encodedQuery}`;

  // Define user-agent real para evitar bloqueios
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  );

  try {
    await page.goto(duckDuckGoUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    const html = await page.content();
    const $ = cheerio.load(html);

    // Coleta os links dos resultados
    const links = [];
    $('a.result__url, a.result__a, a[data-testid="result-title-a"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.startsWith('http')) {
        links.push(href);
      }
    });

    const topLinks = links.slice(0, 3); // Apenas os 3 primeiros

    for (const link of topLinks) {
      try {
        const novaPagina = await browser.newPage();
        await novaPagina.setUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        );
        await novaPagina.goto(link, { waitUntil: 'domcontentloaded', timeout: 30000 });

        const textoPagina = await novaPagina.evaluate(() => document.body.innerText);
        const resumo = textoPagina.substring(0, 500).replace(/\s+/g, ' ').trim();

        resultadoFinal += `🔗 ${link}\n📄 ${resumo}\n\n`;
        await novaPagina.close();
      } catch (erroInterno) {
        console.warn(`⚠️ Erro ao acessar ${link}: ${erroInterno.message}`);
      }
    }

  } catch (erroPrincipal) {
    console.error('Erro na pesquisa:', erroPrincipal.message);
  } finally {
    await browser.close();
  }

  return resultadoFinal || '❌ Nenhum resultado encontrado ou todas as páginas falharam.';
}

module.exports = { buscarResumoWeb };
