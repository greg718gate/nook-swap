const html = await fetch("https://velvetbazzar.co.uk").then((r) => r.text());
const main = html.match(/assets\/index-[^"']+\.js/)?.[0];
const js = await fetch("https://velvetbazzar.co.uk/" + main).then((r) => r.text());
const authChunk = [...js.matchAll(/assets\/Auth-[^"']+\.js/g)][0]?.[0];
const authJs = await fetch("https://velvetbazzar.co.uk/" + authChunk).then((r) => r.text());
console.log("auth chunk:", authChunk);
console.log("new error handling:", authJs.includes("getFunctionErrorMessage"));
console.log("username check:", authJs.includes("ilike"));
