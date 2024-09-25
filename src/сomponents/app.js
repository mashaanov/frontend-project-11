import onChange from 'on-change';
import axios from 'axios';
import { setLocale } from 'yup';
import _ from 'lodash';
import i18next from 'i18next';
import resources from '../locales/index.js';
import render from './view.js';
import validate from './validate.js';
import parser from '../parser.js';

const defaultLanguage = 'ru';

const getAxiosResponse = (url) => {
  const allOrigins = 'https://allorigins.hexlet.app';
  const newUrl = new URL(allOrigins);
  newUrl.searchParams.set('url', url);
  newUrl.searchParams.set('disableCache', 'true');
  return axios.get(newUrl.toString());
};

const createPosts = (state, newPosts, feedId) => {
  const preparedPosts = newPosts.map((newPost) => ({
    ...newPost,
    feedId,
    id: _.uniqueId(),
  }));
  return _.unionBy(preparedPosts, state.contentValue.posts, (post) => `${post.feedId}-${post.title}-${post.link}`);
};

const loadRss = (url, state) => getAxiosResponse(url)
  .then((response) => {
    if (response.status !== 200 || !response.data.contents) {
      throw new Error(`urlDownloadError: ${url}`);
    }
    const parsedContent = parser(response.data.contents);
    const {
      title, link, description, posts,
    } = parsedContent;
    const feedId = _.uniqueId();

    state.contentValue.feeds.push({
      id: feedId,
      url,
      title,
      link,
      description,
    });

    state.contentValue.posts = createPosts(state, posts, feedId);
    state.process.processState = 'success';
  })
  .catch((error) => {
    const isNetworkError = error.response ? 'networkError' : 'urlDownloadError';
    state.valid = false;
    state.process.error = isNetworkError;
    state.process.processState = 'error';
    console.error(`Error while loading RSS: ${error.message}`);
  });

const updateRss = (state) => {
  const updateFeeds = () => {
    if (state.process.processState === 'sending') return;

    const feedPromises = state.contentValue.feeds.map((feed) => getAxiosResponse(feed.url)
      .then((response) => {
        const { contents } = response.data;
        if (!contents || response.status !== 200) {
          throw new Error(`urlDownloadError: ${feed.url}`);
        }
        return parser(contents);
      })
      .then((parsedContent) => {
        const { posts } = parsedContent;
        const postsToAdd = posts.map((post) => ({ feedId: feed.id, id: _.uniqueId(), ...post }));
        state.contentValue.posts = createPosts(state, postsToAdd, feed.id);
      })
      .catch((error) => {
        console.error(error);
      }));

    Promise.all(feedPromises).then(() => {
      setTimeout(updateFeeds, 5000);
    });
  };

  updateFeeds();
};

export default () => {
  document.addEventListener('DOMContentLoaded', () => {
    const i18nInstance = i18next.createInstance();
    i18nInstance.init({
      lng: defaultLanguage,
      resources,
    }).then(() => {
      setLocale({
        mixed: {
          default: i18nInstance.t('feedbacks.feedbackEmpty'),
        },
        string: {
          url: i18nInstance.t('errors.url'),
          email: i18nInstance.t('errors.email'),
          min: i18nInstance.t('errors.min'),
          max: i18nInstance.t('errors.max'),
          modal: document.querySelector('.modal'),
        },
      });

      const elements = {
        form: document.querySelector('form'),
        input: document.querySelector('input[id="url-input"]'),
        button: document.querySelector('button[type="submit"]'),
        feedback: document.querySelector('.feedback'),
        feedsContainer: document.querySelector('.feeds'),
        postsContainer: document.querySelector('.posts'),
        modal: document.querySelector('.modal'),
      };

      const initialState = {
        valid: true,
        errors: {},
        inputValue: '',
        fieldUi: {
          url: false,
        },
        process: {
          processState: 'filling',
          error: null,
        },
        contentValue: {
          posts: [],
          feeds: [],
        },
        loadedRSS: [],
        visitedLinks: [],
        modalId: '',
        values: {
          name: '',
          url: '',
        },
      };

      const watchedState = onChange(initialState, render(elements, initialState, i18nInstance));

      elements.form.addEventListener('input', (e) => {
        const form = e.target.closest('form');
        if (form) {
          const data = new FormData(form);
          const url = data.get('url').trim();
          watchedState.inputValue = url;
          watchedState.process.processState = 'filling';
        }
      });

      elements.form.addEventListener('submit', (e) => {
        e.preventDefault();

        const { inputValue } = watchedState;
        validate(inputValue)
          .then(() => {
            watchedState.valid = true;
            watchedState.process.processState = 'sending';
            return loadRss(inputValue, watchedState);
          })
          .then(() => {
            watchedState.process.processState = 'success';
          })
          .catch((error) => {
            watchedState.valid = false;
            watchedState.process.error = i18nInstance.t('errors.network');
            watchedState.process.processState = 'error';
            console.error(error);
          });
      });

      updateRss(watchedState);
    });
  });
};
