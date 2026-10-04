import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * quiz-buy-lease: scored Buy-vs-Lease questionnaire (TFS buyleasequizcard). Self-contained;
 * stepper / radio / button patterns adapted from blocks/quiz-plans.
 *
 * Authored rows (first cell = row type):
 *  - Image row: [picture]  (quiz card photo)
 *  - Question row: [q1..qN] | [question text] | [ul: one li per option] | [weights, e.g.
 *    "3, 1, -3"; empty / missing = not scored]
 *  - Result row: [Lease | Finance] | [condition; empty = default] | [rich content]
 *  - Products row: [Products] | [heading content above the product cards]
 *  - Product row: [Product] | [condition] | [picture] | [title, description, Learn More link]
 *
 * Outcome = Lease if the sum of the chosen options' weights is > 0, otherwise Finance.
 * The first Result row of that outcome whose condition matches is shown. Every Product row whose
 * condition matches is shown, in authored order.
 * Condition: comma-separated clauses, all must match (AND). A clause is
 *   "qN = k" or "qN = k or m" (options numbered from 1), "Lease", "Finance", or "Always".
 *   An empty condition or "Always" is always true; an unrecognised clause never matches.
 */
let instanceCount = 0;
const DESKTOP_MQ = '(min-width: 900px)';

const cellText = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
const normMinus = (value) => value.replace(/[−–—]/g, '-');

/** "3, 1, -3" -> [3, 1, -3]; empty or malformed -> null (question not scored). */
export function parseWeights(value) {
  const parts = normMinus(value || '').split(/[\s,;|]+/).filter(Boolean);
  if (!parts.length) return null;
  const nums = parts.map(Number);
  return nums.every(Number.isFinite) ? nums : null;
}

/** Parse a condition string into AND-ed clauses. [] = always true. */
export function parseCondition(value) {
  const raw = (value || '').trim().toLowerCase();
  if (!raw || raw === 'always') return [];
  return raw.split(',')
    .map((clause) => clause.trim())
    .filter((clause) => clause && clause !== 'always')
    .map((clause) => {
      if (clause === 'lease' || clause === 'finance') return { outcome: clause };
      const match = clause.match(/^(q\d+)\s*=\s*(.+)$/);
      if (match) {
        const values = match[2].split(/\s*(?:\bor\b|\|)\s*/)
          .map((v) => parseInt(v, 10))
          .filter(Number.isFinite);
        if (values.length) return { question: match[1], values };
      }
      return { invalid: clause };
    });
}

/** answers: { q1: 0-based option index, ... } */
export function matchesCondition(clauses, outcome, answers) {
  return clauses.every((clause) => {
    if (clause.outcome) return clause.outcome === outcome;
    if (clause.question) {
      const index = answers[clause.question];
      return index !== undefined && clause.values.includes(index + 1);
    }
    return false;
  });
}

export function scoreAnswers(questions, answers) {
  return questions.reduce((sum, q) => {
    const index = answers[q.id];
    if (!q.weights || index === undefined) return sum;
    return sum + (q.weights[index] || 0);
  }, 0);
}

function optimized(picture, eager, breakpoints) {
  const img = picture?.querySelector('img');
  if (!img) return picture;
  return createOptimizedPicture(img.src, img.alt || '', eager, breakpoints);
}

function parseRows(block) {
  const data = {
    picture: null, questions: [], results: [], productsHeading: null, products: [],
  };
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const type = cellText(cells[0]).toLowerCase();

    if (/^q\d+$/.test(type) && cells.length >= 3) {
      const items = [...cells[2].querySelectorAll('li')];
      const sources = items.length ? items : [...cells[2].querySelectorAll('p')];
      const options = sources.map((item) => cellText(item)).filter(Boolean);
      const weights = parseWeights(cellText(cells[3]));
      if (cellText(cells[3]) && !weights) {
        // eslint-disable-next-line no-console
        console.warn(`quiz-buy-lease: invalid weights for ${type}, question not scored`);
      }
      if (options.length) {
        data.questions.push({
          id: type, text: cellText(cells[1]), options, weights,
        });
      }
    } else if ((type === 'lease' || type === 'finance') && cells.length >= 2) {
      data.results.push({
        outcome: type,
        clauses: parseCondition(cells.length >= 3 ? cellText(cells[1]) : ''),
        content: cells[cells.length - 1],
      });
    } else if (type === 'products' && cells.length >= 2) {
      data.productsHeading = cells[cells.length - 1];
    } else if (type === 'product' && cells.length >= 2) {
      const rest = cells.slice(1);
      let condition = '';
      let pictureCell = null;
      let content;
      if (rest.length >= 3) {
        [, pictureCell, content] = rest;
        condition = cellText(rest[0]);
      } else if (rest.length === 2 && rest[0].querySelector('picture') && !cellText(rest[0])) {
        [pictureCell, content] = rest;
      } else if (rest.length === 2) {
        condition = cellText(rest[0]);
        [, content] = rest;
      } else {
        [content] = rest;
      }
      let picture = pictureCell?.querySelector('picture') || null;
      if (!picture) {
        picture = content.querySelector('picture');
        if (picture) {
          const holder = picture.parentElement;
          picture.remove();
          if (holder !== content && !cellText(holder) && !holder.children.length) holder.remove();
        }
      }
      data.products.push({ clauses: parseCondition(condition), picture, content });
    } else if (!data.picture && row.querySelector('picture')) {
      data.picture = row.querySelector('picture');
    }
  });
  return data;
}

function createButton(className, label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  return button;
}

function buildCard(product) {
  const card = document.createElement('div');
  card.className = 'quiz-buy-lease-card';
  const body = document.createElement('div');
  body.className = 'quiz-buy-lease-card-body';
  body.append(...product.content.childNodes);
  const first = body.firstElementChild;
  if (first && (/^H[1-6]$/.test(first.tagName)
    || (first.tagName === 'P' && first.querySelector('strong, b') && cellText(first) === cellText(first.querySelector('strong, b'))))) {
    first.classList.add('quiz-buy-lease-card-title');
  }
  card.append(body);
  if (product.picture) {
    const media = document.createElement('div');
    media.className = 'quiz-buy-lease-card-media';
    media.append(optimized(product.picture, false, [{ width: '600' }]));
    card.append(media);
  }
  return card;
}

export default function decorate(block) {
  instanceCount += 1;
  const prefix = `quiz-buy-lease-${instanceCount}`;
  const data = parseRows(block);
  block.textContent = '';
  if (!data.questions.length) return;
  const { questions } = data;
  const total = questions.length;

  /* ---------- quiz card ---------- */
  const quiz = document.createElement('div');
  quiz.className = 'quiz-buy-lease-quiz';
  if (data.picture) {
    const media = document.createElement('div');
    media.className = 'quiz-buy-lease-media';
    media.append(optimized(data.picture, false, [
      { media: DESKTOP_MQ, width: '600' },
      { width: '750' },
    ]));
    quiz.append(media);
  }

  const body = document.createElement('div');
  body.className = 'quiz-buy-lease-body';
  const steps = document.createElement('div');
  steps.className = 'quiz-buy-lease-steps';

  const fieldsets = questions.map((question, qi) => {
    const fieldset = document.createElement('fieldset');
    fieldset.className = 'quiz-buy-lease-question';
    fieldset.dataset.question = question.id;
    fieldset.tabIndex = -1;
    fieldset.hidden = qi !== 0;
    const legend = document.createElement('legend');
    legend.className = 'quiz-buy-lease-legend';
    const counter = document.createElement('span');
    counter.className = 'quiz-buy-lease-counter';
    counter.textContent = `Question ${qi + 1} of ${total}`;
    const text = document.createElement('span');
    text.className = 'quiz-buy-lease-question-text';
    text.textContent = question.text;
    legend.append(counter, text);

    const list = document.createElement('div');
    list.className = 'quiz-buy-lease-answers';
    question.options.forEach((label, oi) => {
      const id = `${prefix}-${question.id}-${oi}`;
      const option = document.createElement('div');
      option.className = 'quiz-buy-lease-answer';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = `${prefix}-${question.id}`;
      input.id = id;
      input.value = String(oi);
      const labelEl = document.createElement('label');
      labelEl.htmlFor = id;
      labelEl.textContent = label;
      option.append(input, labelEl);
      list.append(option);
    });
    fieldset.append(legend, list);
    steps.append(fieldset);
    return fieldset;
  });

  const nav = document.createElement('div');
  nav.className = 'quiz-buy-lease-nav';
  const back = createButton('quiz-buy-lease-back secondary', 'Back');
  const next = createButton('quiz-buy-lease-next', 'Next');
  nav.append(back, next);
  body.append(steps, nav);
  quiz.append(body);

  const live = document.createElement('p');
  live.className = 'quiz-buy-lease-live';
  live.setAttribute('role', 'status');
  live.setAttribute('aria-live', 'polite');

  /* ---------- results ---------- */
  const results = document.createElement('div');
  results.className = 'quiz-buy-lease-results';
  results.setAttribute('role', 'region');
  results.setAttribute('aria-label', 'Quiz results');
  results.tabIndex = -1;
  results.hidden = true;

  const resultEls = data.results.map((result) => {
    const el = document.createElement('div');
    el.className = 'quiz-buy-lease-result';
    el.dataset.outcome = result.outcome;
    el.hidden = true;
    el.append(...result.content.childNodes);
    results.append(el);
    return el;
  });

  const productsLabel = cellText(data.productsHeading).replace(/:$/, '') || 'Recommended products';
  const products = document.createElement('div');
  products.className = 'quiz-buy-lease-products';
  if (data.productsHeading) {
    const heading = document.createElement('div');
    heading.className = 'quiz-buy-lease-products-heading';
    heading.append(...data.productsHeading.childNodes);
    products.append(heading);
  }
  const carousel = document.createElement('div');
  carousel.className = 'quiz-buy-lease-carousel';
  carousel.setAttribute('role', 'region');
  carousel.setAttribute('aria-roledescription', 'carousel');
  carousel.setAttribute('aria-label', productsLabel);
  const slidesEl = document.createElement('div');
  slidesEl.className = 'quiz-buy-lease-slides';
  const dotsEl = document.createElement('div');
  dotsEl.className = 'quiz-buy-lease-dots';
  carousel.append(slidesEl, dotsEl);
  products.append(carousel);
  const cards = data.products.map((product) => ({ ...product, el: buildCard(product) }));
  if (cards.length) results.append(products);

  const actions = document.createElement('div');
  actions.className = 'quiz-buy-lease-actions';
  const restart = createButton('quiz-buy-lease-restart secondary', 'Start over');
  actions.append(restart);
  results.append(actions);

  block.append(quiz, live, results);

  /* ---------- state ---------- */
  let current = 0;
  let visibleCards = [];
  let hiddenIntro = [];
  const mq = window.matchMedia(DESKTOP_MQ);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const checkedIndex = (qi) => {
    const checked = fieldsets[qi].querySelector('input:checked');
    return checked ? Number(checked.value) : undefined;
  };

  function renderStep(focus) {
    fieldsets.forEach((fs, i) => { fs.hidden = i !== current; });
    back.hidden = current === 0;
    next.textContent = current === total - 1 ? 'Submit' : 'Next';
    next.disabled = checkedIndex(current) === undefined;
    if (focus) fieldsets[current].focus();
  }

  function showSlide(index) {
    [...slidesEl.children].forEach((slide, i) => { slide.hidden = i !== index; });
    [...dotsEl.children].forEach((dot, i) => {
      if (i === index) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  }

  function buildCarousel() {
    slidesEl.textContent = '';
    dotsEl.textContent = '';
    const perSlide = mq.matches ? 3 : 1;
    const chunks = [];
    for (let i = 0; i < visibleCards.length; i += perSlide) {
      chunks.push(visibleCards.slice(i, i + perSlide));
    }
    chunks.forEach((chunk, i) => {
      const slide = document.createElement('div');
      slide.className = 'quiz-buy-lease-slide';
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', 'slide');
      slide.setAttribute('aria-label', `${i + 1} of ${chunks.length}`);
      slide.append(...chunk.map((card) => card.el));
      slidesEl.append(slide);
      if (chunks.length > 1) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'quiz-buy-lease-dot';
        dot.setAttribute('aria-label', `Show slide ${i + 1} of ${chunks.length}`);
        dot.addEventListener('click', () => showSlide(i));
        dotsEl.append(dot);
      }
    });
    dotsEl.hidden = chunks.length < 2;
    products.hidden = !visibleCards.length;
    showSlide(0);
  }

  function setIntroHidden(hide) {
    if (hide) {
      hiddenIntro = [];
      const wrapper = block.closest('.quiz-buy-lease-wrapper') || block;
      let el = wrapper.previousElementSibling;
      while (el && el.classList.contains('default-content-wrapper')) {
        if (!el.hidden) {
          el.hidden = true;
          hiddenIntro.push(el);
        }
        el = el.previousElementSibling;
      }
    } else {
      hiddenIntro.forEach((el) => { el.hidden = false; });
      hiddenIntro = [];
    }
  }

  function submit() {
    const answers = {};
    questions.forEach((q, qi) => {
      const index = checkedIndex(qi);
      if (index !== undefined) answers[q.id] = index;
    });
    const score = scoreAnswers(questions, answers);
    const outcome = score > 0 ? 'lease' : 'finance';
    block.dataset.outcome = outcome;
    block.dataset.score = String(score);

    const chosen = data.results.findIndex((r) => r.outcome === outcome
      && matchesCondition(r.clauses, outcome, answers));
    resultEls.forEach((el, i) => { el.hidden = i !== chosen; });

    visibleCards = cards.filter((c) => matchesCondition(c.clauses, outcome, answers));
    buildCarousel();

    quiz.hidden = true;
    setIntroHidden(true);
    results.hidden = false;
    block.classList.add('quiz-buy-lease-has-result');

    const heading = resultEls[chosen]?.querySelector('h3') || resultEls[chosen]?.querySelector('h2, h3, h4');
    const summary = heading ? cellText(heading) : `${outcome === 'lease' ? 'Lease' : 'Finance'} your vehicle`;
    const count = visibleCards.length;
    live.textContent = `Quiz results: ${summary}.${count ? ` ${count} recommended product${count > 1 ? 's' : ''}.` : ''}`;

    results.scrollIntoView({ block: 'start', behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    results.focus({ preventScroll: true });
  }

  function startOver() {
    fieldsets.forEach((fs) => fs.querySelectorAll('input:checked').forEach((input) => { input.checked = false; }));
    current = 0;
    results.hidden = true;
    resultEls.forEach((el) => { el.hidden = true; });
    visibleCards = [];
    slidesEl.textContent = '';
    dotsEl.textContent = '';
    delete block.dataset.outcome;
    delete block.dataset.score;
    block.classList.remove('quiz-buy-lease-has-result');
    quiz.hidden = false;
    const firstIntro = hiddenIntro[hiddenIntro.length - 1];
    setIntroHidden(false);
    live.textContent = '';
    renderStep(false);
    (firstIntro || block).scrollIntoView({ block: 'start', behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    fieldsets[0].focus({ preventScroll: true });
  }

  steps.addEventListener('change', () => {
    next.disabled = checkedIndex(current) === undefined;
  });

  next.addEventListener('click', () => {
    if (checkedIndex(current) === undefined) return;
    if (current < total - 1) {
      current += 1;
      renderStep(true);
    } else {
      submit();
    }
  });

  back.addEventListener('click', () => {
    if (current === 0) return;
    current -= 1;
    renderStep(true);
  });

  restart.addEventListener('click', startOver);

  mq.addEventListener('change', () => {
    if (!results.hidden) buildCarousel();
  });

  renderStep(false);
}
