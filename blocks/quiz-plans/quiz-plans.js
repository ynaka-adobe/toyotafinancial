import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * quiz-plans: branching radio questionnaire in a framed card with a photo
 * (TFS "Which plan is right for me?" quiz-component). New base block, self-contained.
 *
 * Authored rows:
 *  - Image row (optional): 1 cell holding a picture.
 *  - Question row: [step id, e.g. q1] | [question text] | [ul: one li per answer; each li holds a
 *    link whose href is '#<next step id>' (another question or a result). The answer label is
 *    the li text; a link whose text is just the id/hash is dropped from the label].
 *  - Result row: [result id, e.g. a4a] | [Result] | [rich content, e.g. ul of li = h3/strong link
 *    to the product page + p description].
 * The first question row is the start step. "Question n of N" uses the longest question chain.
 * Next stays disabled until an answer is chosen; Back returns to the previous step (answers kept);
 * results are announced through an aria-live region and offer Back / Start over.
 */
let instanceCount = 0;

const normId = (value) => (value || '').trim().replace(/^#/, '').toLowerCase();

function parseAnswers(cell) {
  const items = [...cell.querySelectorAll('li')];
  const sources = items.length ? items : [...cell.querySelectorAll('p')];
  return sources.map((item) => {
    const link = item.querySelector('a[href]');
    let target = '';
    let href = '';
    if (link) {
      const raw = link.getAttribute('href') || '';
      href = link.href;
      const hashIndex = raw.indexOf('#');
      if (hashIndex >= 0) target = normId(raw.slice(hashIndex + 1));
    }
    let label = item.textContent.trim();
    if (link) {
      const linkText = link.textContent.trim();
      if (normId(linkText) === target && label !== linkText) {
        label = label.replace(linkText, '').trim();
      }
    }
    return { label, target, href };
  }).filter((a) => a.label);
}

function parseRows(block) {
  let picture = null;
  const steps = new Map();
  let start = null;

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length < 3) {
      const pic = row.querySelector('picture');
      if (pic && !picture) picture = pic;
      return;
    }
    const [idCell, textCell, bodyCell] = cells;
    const id = normId(idCell.textContent);
    if (!id) return;
    const isResult = textCell.textContent.trim().toLowerCase() === 'result';
    if (isResult) {
      steps.set(id, { id, type: 'result', content: bodyCell });
    } else {
      steps.set(id, {
        id,
        type: 'question',
        question: textCell.textContent.trim(),
        answers: parseAnswers(bodyCell),
      });
      if (!start) start = id;
    }
  });

  return { picture, steps, start };
}

function longestChain(steps, id, seen = new Set()) {
  const step = steps.get(id);
  if (!step || step.type !== 'question' || seen.has(id)) return 0;
  seen.add(id);
  const next = step.answers.map((a) => longestChain(steps, a.target, new Set(seen)));
  return 1 + Math.max(0, ...next);
}

export default function decorate(block) {
  instanceCount += 1;
  const prefix = `quiz-plans-${instanceCount}`;
  const { picture, steps, start } = parseRows(block);
  block.textContent = '';
  if (!start) return;

  const total = longestChain(steps, start);

  if (picture) {
    const img = picture.querySelector('img');
    const media = document.createElement('div');
    media.className = 'quiz-plans-media';
    media.append(createOptimizedPicture(img.src, img.alt || '', false, [
      { media: '(min-width: 900px)', width: '600' },
      { width: '750' },
    ]));
    block.append(media);
  }

  const body = document.createElement('div');
  body.className = 'quiz-plans-body';

  const live = document.createElement('p');
  live.className = 'quiz-plans-live';
  live.setAttribute('aria-live', 'polite');
  live.setAttribute('role', 'status');

  const stepsEl = document.createElement('div');
  stepsEl.className = 'quiz-plans-steps';

  const stepEls = new Map();
  steps.forEach((step) => {
    let el;
    if (step.type === 'question') {
      el = document.createElement('fieldset');
      el.className = 'quiz-plans-question';
      const legend = document.createElement('legend');
      legend.className = 'quiz-plans-legend';
      const counter = document.createElement('span');
      counter.className = 'quiz-plans-counter';
      const text = document.createElement('span');
      text.className = 'quiz-plans-question-text';
      text.textContent = step.question;
      legend.append(counter, text);
      el.append(legend);

      const list = document.createElement('div');
      list.className = 'quiz-plans-answers';
      step.answers.forEach((answer, ai) => {
        const inputId = `${prefix}-${step.id}-${ai}`;
        const option = document.createElement('div');
        option.className = 'quiz-plans-answer';
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = `${prefix}-${step.id}`;
        input.id = inputId;
        input.value = String(ai);
        const label = document.createElement('label');
        label.htmlFor = inputId;
        label.textContent = answer.label;
        option.append(input, label);
        list.append(option);
      });
      el.append(list);
    } else {
      el = document.createElement('div');
      el.className = 'quiz-plans-result';
      el.setAttribute('role', 'region');
      el.setAttribute('aria-label', 'Recommended plans');
      el.append(...step.content.childNodes);
      el.querySelectorAll('a.button').forEach((a) => a.classList.remove('button', 'primary', 'secondary'));
    }
    el.dataset.step = step.id;
    el.hidden = true;
    el.tabIndex = -1;
    stepEls.set(step.id, el);
    stepsEl.append(el);
  });

  const nav = document.createElement('div');
  nav.className = 'quiz-plans-nav';
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'quiz-plans-back secondary';
  back.textContent = 'Back';
  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'quiz-plans-next';
  next.textContent = 'Next';
  const restart = document.createElement('button');
  restart.type = 'button';
  restart.className = 'quiz-plans-restart secondary';
  restart.textContent = 'Start over';
  nav.append(back, next, restart);

  body.append(live, stepsEl, nav);
  block.append(body);

  const history = [];
  let current = start;

  function selectedAnswer() {
    const step = steps.get(current);
    if (!step || step.type !== 'question') return null;
    const checked = stepEls.get(current).querySelector('input:checked');
    return checked ? step.answers[Number(checked.value)] : null;
  }

  function render(focus) {
    const step = steps.get(current);
    stepEls.forEach((el, id) => { el.hidden = id !== current; });
    const el = stepEls.get(current);
    const isResult = step.type === 'result';
    if (!isResult) {
      const n = history.filter((id) => steps.get(id)?.type === 'question').length + 1;
      el.querySelector('.quiz-plans-counter').textContent = `Question ${n} of ${Math.max(total, n)}`;
      live.textContent = '';
    } else {
      live.textContent = 'Here are the plans we recommend for you.';
    }
    back.hidden = history.length === 0;
    next.hidden = isResult;
    restart.hidden = !isResult;
    next.disabled = !selectedAnswer();
    block.classList.toggle('quiz-plans-has-result', isResult);
    if (focus) el.focus();
  }

  stepsEl.addEventListener('change', () => {
    next.disabled = !selectedAnswer();
  });

  next.addEventListener('click', () => {
    const answer = selectedAnswer();
    if (!answer) return;
    if (answer.target && steps.has(answer.target)) {
      history.push(current);
      current = answer.target;
      render(true);
    } else if (answer.href && !answer.href.includes('#')) {
      window.location.href = answer.href;
    }
  });

  back.addEventListener('click', () => {
    if (!history.length) return;
    current = history.pop();
    render(true);
  });

  restart.addEventListener('click', () => {
    history.length = 0;
    current = start;
    stepEls.forEach((el) => el.querySelectorAll('input:checked').forEach((i) => { i.checked = false; }));
    render(true);
  });

  render(false);
}
