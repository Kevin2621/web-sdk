import hashes from './bonusFixtureHashes.json' with {type:'json'};
// Only allow the exact C02-validated local books. This is not live RGS validation.
export async function validateBonusFixture(book) {
 if(book?.fixtureOnly!==true || book.schemaVersion!==1 || book.gameId!=='wild_pickins') throw Error('Unsupported bonus fixture');
 const bytes=new TextEncoder().encode(JSON.stringify(book));
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 const hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 if(!hashes.includes(hash)) throw Error('Bonus fixture differs from C02-validated manifest; revalidate before playback');
 return book;
}
