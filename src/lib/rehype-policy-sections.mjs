// Restructures legal markdown for the policy design without touching its text:
// - each h2 and the content after it becomes a <section class="policy-section">
// - the "1." number at the start of an h2 is wrapped in <span class="num">
// - inside a section, each h3 and its content becomes a <div class="policy-card">
// - the last section's body is wrapped in <div class="policy-contact">
// - the markdown `---` rules are dropped (sections draw their own dividers)

const el = (tagName, className, children) => ({
  type: 'element',
  tagName,
  properties: { className: [className] },
  children,
});

const isTag = (node, tag) => node.type === 'element' && node.tagName === tag;

function wrapNumber(h2) {
  const first = h2.children[0];
  if (first?.type !== 'text') return;
  const match = first.value.match(/^(\d+\.)(\s+)/);
  if (!match) return;
  h2.children.splice(
    0,
    1,
    el('span', 'num', [{ type: 'text', value: match[1] }]),
    { type: 'text', value: match[2] + first.value.slice(match[0].length) },
  );
}

function groupCards(nodes) {
  const out = [];
  let card = null;
  for (const node of nodes) {
    if (isTag(node, 'h3')) {
      card = el('div', 'policy-card', [node]);
      out.push(card);
    } else if (card) {
      card.children.push(node);
    } else {
      out.push(node);
    }
  }
  return out;
}

export default function rehypePolicySections() {
  return (tree) => {
    const out = [];
    const sections = [];
    let current = null;

    for (const node of tree.children) {
      if (isTag(node, 'hr')) continue;
      if (isTag(node, 'h2')) {
        wrapNumber(node);
        current = { heading: node, body: [] };
        sections.push(current);
        out.push(current);
      } else if (current) {
        current.body.push(node);
      } else {
        out.push(node);
      }
    }

    if (sections.length === 0) return;

    tree.children = out.map((item) => {
      if (!sections.includes(item)) return item;
      const isLast = item === sections[sections.length - 1];
      const body = groupCards(item.body);
      return el('section', 'policy-section', [
        item.heading,
        ...(isLast ? [el('div', 'policy-contact', body)] : body),
      ]);
    });
  };
}
