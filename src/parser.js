export default (responseData) => {
  const parser = new DOMParser();
  const xmlDocument = parser.parseFromString(responseData, 'application/xml');

  if (xmlDocument.querySelector('parsererror')) {
    const err = new Error();
    err.name = 'parsingError';
    throw err;
  } else {
    const channel = xmlDocument.querySelector('channel');
    const channelTitle = channel.querySelector('title').textContent;
    const channelDescription = channel.querySelector('description').textContent;
    const feed = { channelTitle, channelDescription };

    const itemsElements = document.querySelector('items');
    const posts = [...itemsElements].map((item) => {
      const description = item.querySelector('description').textContent;
      const title = item.querySelector('title').textContent;
      const link = item.querySelector('link').textContent;
      return {
        title,
        description,
        link,
      };
    });

    const parsedRSS = { feed, posts };
    return parsedRSS;
  }
};
