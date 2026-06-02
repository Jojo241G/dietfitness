import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

/**
 * Export PDF via expo-print + expo-sharing (100% compatibles Expo Go / Android 14).
 * On génère un HTML stylé, expo-print le convertit en PDF, expo-sharing ouvre
 * la feuille de partage native (enregistrer, envoyer, etc.).
 */

const STYLE = `
  <style>
    * { font-family: -apple-system, Roboto, Helvetica, sans-serif; }
    body { color: #1c3a2e; padding: 24px; }
    h1 { color: #1c3a2e; font-size: 24px; margin-bottom: 4px; }
    h2 { color: #3d6b52; font-size: 16px; margin: 18px 0 6px; border-bottom: 2px solid #e2ded7; padding-bottom: 4px; }
    .sub { color: #6b7a6e; font-size: 12px; margin-bottom: 16px; }
    .badge { display: inline-block; background: #eef5f1; color: #1c3a2e; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; }
    .macros span { display: inline-block; background: #e2ded7; padding: 3px 8px; border-radius: 4px; font-size: 11px; margin-right: 6px; }
    p { font-size: 13px; line-height: 1.5; }
    .coach { background: #f1f6f3; padding: 12px; border-radius: 8px; font-style: italic; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    td, th { border: 1px solid #e2ded7; padding: 8px; font-size: 12px; text-align: left; }
    th { background: #1c3a2e; color: #f7f3ec; }
    .footer { margin-top: 28px; color: #6b7a6e; font-size: 10px; text-align: center; }
  </style>
`;

async function imprimerEtPartager(html, nom) {
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: nom,
      UTI: 'com.adobe.pdf',
    });
  }
  return uri;
}

/** PDF d'une recette unique. */
export async function exporterRecettePDF(plat) {
  const html = `
    <html><head><meta charset="utf-8">${STYLE}</head><body>
      <h1>${plat.nom}</h1>
      <div class="sub">${plat.origine || ''} • ${plat.moment || ''}</div>
      <span class="badge">${plat.calories} kcal</span>
      <h2>Portion</h2>
      <p>${plat.portion_standard || '—'}</p>
      <h2>Valeurs nutritionnelles</h2>
      <div class="macros">
        <span>Protéines : ${plat.macros?.proteines ?? '?'}</span>
        <span>Glucides : ${plat.macros?.glucides ?? '?'}</span>
        <span>Lipides : ${plat.macros?.lipides ?? '?'}</span>
      </div>
      <h2>Description</h2>
      <p>${plat.description || ''}</p>
      <h2>Recette</h2>
      <p>${plat.recette_explicite || 'Non disponible.'}</p>
      ${plat.conseil_coach ? `<h2>Conseil du coach</h2><div class="coach">${plat.conseil_coach}</div>` : ''}
      <div class="footer">Généré par DietFitness 🇨🇲</div>
    </body></html>
  `;
  return imprimerEtPartager(html, `Recette ${plat.nom}`);
}

/** PDF du planning de la semaine. */
export async function exporterPlanningPDF(planning, prenom = '') {
  const lignes = planning.jours.map((j) => {
    const cellules = j.repas.map((r) =>
      `<td><b>${r.type}</b><br>${r.plat ? `${r.plat.nom}<br><small>${r.plat.calories} kcal</small>` : '—'}</td>`
    ).join('');
    return `<tr><th style="background:#3d6b52">${j.jour}</th>${cellules}<td><b>${j.total}</b> kcal</td></tr>`;
  }).join('');

  const html = `
    <html><head><meta charset="utf-8">${STYLE}</head><body>
      <h1>Planning nutritionnel — 7 jours</h1>
      <div class="sub">${prenom ? `Pour ${prenom} • ` : ''}Objectif : ${planning.objectif.toLocaleString()} kcal / jour</div>
      <table>
        <tr><th>Jour</th><th>Matin</th><th>Midi</th><th>Soir</th><th>Total</th></tr>
        ${lignes}
      </table>
      <p style="margin-top:16px;font-size:11px;color:#6b7a6e;">
        Planning généré localement en excluant les allergènes et contre-indications de ton profil.
      </p>
      <div class="footer">Généré par DietFitness 🇨🇲</div>
    </body></html>
  `;
  return imprimerEtPartager(html, 'Planning de la semaine');
}
