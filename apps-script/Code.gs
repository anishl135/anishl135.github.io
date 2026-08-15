/**
 * Blog feed - serves a Google Doc as JSON for the blog page.
 *
 * Update the Google Doc, refresh the website, done. No redeploys needed.
 *
 * SETUP
 *   1. script.google.com -> New project -> paste this file -> save (Ctrl+S).
 *   2. Set DEFAULT_DOC_ID to your Google Doc's ID (the long string in the
 *      doc URL between /d/ and /edit).
 *   3. Deploy -> New deployment -> Web app:
 *        - Description: "Blog feed"
 *        - Execute as: Me
 *        - Who has access: Anyone
 *      Click Deploy, copy the /exec URL, and paste it into src/blog.js
 *      (the FEED_URL constant at the top).
 *   4. Optional: run the test() function to preview the JSON in the editor
 *      (View -> Log).
 *
 * DOC FORMAT (inside your Google Doc)
 *   - Heading 1           = a post title (each new Heading 1 starts a post)
 *   - Heading 2           = a subheading inside a post
 *   - Normal text         = a paragraph
 *   - Bulleted list items = bullets (make them bullets in the doc)
 *   - Optional first line "DATE: 2026-08-20" (any format) = the date shown
 *     on the post card
 *   - Text before the first Heading 1 is ignored (reserved for a doc intro)
 */

const DEFAULT_DOC_ID = 'PASTE_YOUR_GOOGLE_DOC_ID_HERE';

function doGet(e) {
  const docId = (e && e.parameter && e.parameter.doc) || DEFAULT_DOC_ID;
  try {
    const doc = DocumentApp.openById(docId);
    const body = doc.getBody();

    const posts = [];
    let current = null;

    body.getParagraphs().forEach((p) => {
      const text = p.getText().trim();
      if (!text) return;

      // A Heading 1 starts a new post.
      if (p.getHeading() === DocumentApp.ParagraphHeading.HEADING1) {
        if (current) posts.push(current);
        current = { title: text, date: null, blocks: [] };
        return;
      }

      // Ignore anything written before the first post.
      if (!current) return;

      if (p.getHeading() === DocumentApp.ParagraphHeading.HEADING2) {
        current.blocks.push({ type: 'h3', text: text });
        return;
      }

      // Optional per-post date, e.g. "DATE: 2026-08-20".
      if (!current.date && /^DATE:/i.test(text)) {
        current.date = text.replace(/^DATE:\s*/i, '').trim();
        return;
      }

      current.blocks.push({
        type: p.getType() === DocumentApp.ElementType.LIST_ITEM ? 'li' : 'p',
        text: text,
      });
    });
    if (current) posts.push(current);

    return json_({
      blogTitle: doc.getName(),
      updated: new Date().toISOString(),
      count: posts.length,
      posts: posts,
    });
  } catch (err) {
    return json_({ error: String(err), posts: [] });
  }
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Preview the feed output from the Apps Script editor (View -> Log). */
function test() {
  Logger.log(JSON.stringify(doGet({ parameter: {} }), null, 2));
}
