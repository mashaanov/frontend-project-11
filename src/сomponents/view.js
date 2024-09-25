const createCard = (title, i18nInstance) => {
  const card = document.createElement('div');
  card.classList.add('card', 'border-0');

  const cardBody = document.createElement('div');
  cardBody.classList.add('card-body');

  const cardTitle = document.createElement('h2');
  cardTitle.classList.add('card-title', 'h4');
  cardTitle.textContent = i18nInstance(title);

  cardBody.append(cardTitle);
  card.append(cardBody);

  return { card, cardBody };
};

const renderPosts = (state, div, i18nInstance) => {
  const ul = document.createElement('ul');
  ul.classList.add('list-group', 'border-0', 'rounded-0');

  const { posts } = state.contentValue;
  posts.forEach((post) => {
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');

    const a = document.createElement('a');
    a.classList.add('fw-bold');
    a.setAttribute('href', post.link);
    a.setAttribute('data-id', post.id);
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
    a.textContent = post.description;

    const button = document.createElement('button');
    button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    button.setAttribute('type', 'button');
    button.setAttribute('data-id', post.id);
    button.setAttribute('data-bs-toggle', 'modal');
    button.setAttribute('data-bs-target', '#modal');
    button.textContent = i18nInstance.t('buttons.viewBtn');

    li.append(a, button);
    ul.append(li);
  });
  div.append(ul);
};

const renderFeeds = (state, div) => {
  const listGroup = document.createElement('ul');
  listGroup.classList.add('list-group', 'border-0', 'rounded-0');

  const { feeds } = state.contentValue;
  feeds.forEach((feed) => {
    const listGroupItem = document.createElement('li');
    listGroupItem.classList.add('list-group-item', 'border-0', 'border-end-0');

    const h3 = document.createElement('h3');
    h3.classList.add('h6', 'm-0');
    h3.textContent = feed.title;

    const pEl = document.createElement('p');
    pEl.classList.add('m-0', 'small', 'text-black-50');
    pEl.textContent = feed.description;

    listGroupItem.append(h3, pEl);
    listGroup.append(listGroupItem);
  });

  div.append(listGroup);
};

const createContainer = (title, state, elements, i18nInstance) => {
  const container = elements[`${title}Container`];
  if (!container) {
    throw new Error(`No container found for title: ${title}`);
  }
  container.textContent = '';
  const { card, cardBody } = createCard(title, i18nInstance);
  container.append(card);

  if (title === 'feeds') {
    renderFeeds(state.contentValue.feeds, cardBody);
  } else if (title === 'posts') {
    renderPosts(state.contentValue.posts, cardBody, i18nInstance);
  } else {
    throw new Error(`Unknown type: ${title}`);
  }
};

const handleSuccessFinish = (elements, i18nInstance) => {
  const { form, input, feedback } = elements;
  feedback.classList.remove('text-danger');
  feedback.classList.add('text-success');
  input.classList.remove('is-invalid');
  const feedbackText = i18nInstance.t('translation.feedbacks.feedbackSuccess');
  feedback.textContent = feedbackText;
  form.reset();
  input.focus();
};

const handleFinishWithError = (elements, i18nInstance, state) => {
  const { input, feedback } = elements;
  if (state.process.error !== null) {
    switch (state.process.error) {
      case 'Network Error':
        feedback.textContent = i18nInstance.t('translation.errors.network');
        break;
      case 'noRSS':
        feedback.textContent = i18nInstance.t('translation.feedbacks.feedbackNoRSS');
        break;
      case 'WrongUrl':
        feedback.textContent = i18nInstance.t('translation.feedbacks.feedbackWrongUrl');
        break;
      case 'Repeat':
        feedback.textContent = i18nInstance.t('translation.feedbacks.feedbackRepeat');
        break;
      default:
        feedback.textContent = i18nInstance.t('translation.feedbacks.feedbackEmpty');
    }
  } else {
    input.classList.remove('is-invalid');
    feedback.classList.remove('text-danger');
  }
};

const handleProcessState = (elements, processState, i18nInstance) => {
  const { input, button, feedback } = elements;
  switch (processState) {
    case 'filling':
      input.classList.remove('is-invalid');
      feedback.textContent = '';
      input.disabled = false;
      button.disabled = false;
      break;
    case 'success':
      handleSuccessFinish(elements, i18nInstance);
      input.disabled = false;
      button.disabled = false;
      break;
    case 'error':
      handleFinishWithError(elements, i18nInstance);
      input.disabled = false;
      button.disabled = false;
      break;
    case 'sending':
      input.disabled = true;
      button.disabled = true;
      break;
    default:
      throw new Error(`Unknown process state: ${processState}`);
  }
};

const renderModal = (elements, state) => {
  const { modal } = elements;
  modal.classList.add('show');
  modal.setAttribute('aria-modal', 'true');
  modal.removeAttribute('aria-hidden');
  modal.style.display = 'block';

  const { posts } = state.contentValue;
  const loadedPost = posts.find((post) => post.id === state.modalId);
  const modalTitle = document.querySelector('.modal-title');
  modalTitle.textContent = loadedPost.title;
  const modalBody = document.querySelector('.modal-body');
  modalBody.textContent = loadedPost.description;
  const modalLink = document.querySelector('.full-article');
  modalLink.href = loadedPost.link;
};

const renderOpenedPosts = (elements, state) => {
  const { modal } = elements;
  modal.classList.remove('show');
  modal.removeAttribute('aria-modal');
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');

  const openedPost = document.querySelector(`a[data-id="${state.modalId}"]`);
  openedPost.classList.remove('fw-bold');
  openedPost.classList.add('fw-normal');
  openedPost.classList.add('link-secondary');
};

export default (elements, state, i18nInstance) => (path) => {
  const { input } = elements;
  switch (path) {
    case 'process.processState':
      handleProcessState(elements, state, state.process.processState, i18nInstance);
      break;
    case 'process.error':
      handleFinishWithError(elements, i18nInstance);
      break;
    case 'contentValue.posts':
      createContainer('posts', state, elements, i18nInstance);
      break;
    case 'contentValue.feeds':
      createContainer('feeds', state, elements, i18nInstance);
      break;
    case 'modalId':
      renderModal(elements, state);
      break;
    case 'visitedLinks':
      renderOpenedPosts(elements, state);
      break;
    case 'inputValue':
      input.value = state.inputValue;
      break;
    case 'valid':
      handleSuccessFinish(elements, i18nInstance);
      break;
    default:
      throw new Error(`Unknown path: ${path}`);
  }
};
