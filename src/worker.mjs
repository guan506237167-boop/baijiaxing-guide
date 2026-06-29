const CANONICAL_HOST = "www.chinesefamilynames.com";
const ROOT_HOST = "chinesefamilynames.com";

export default {
  fetch(request, env) {
    const url = new URL(request.url);

    if (url.hostname === ROOT_HOST) {
      url.hostname = CANONICAL_HOST;
      return Response.redirect(url.toString(), 301);
    }

    return env.ASSETS.fetch(request);
  }
};
