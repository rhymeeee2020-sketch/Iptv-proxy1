export default {
  async fetch(request) {
    const url = new URL(request.url);
    const ORIGIN_M3U = 'https://raw.githubusercontent.com/rhymeeee2020-sketch/M3u/refs/heads/main/tv2';
    
    const USERS = {
      'free': 'free123'
    };

    // Auth function
    function checkAuth(request) {
      const auth = request.headers.get('Authorization');
      if (!auth || !auth.startsWith('Basic ')) return false;
      const base64 = auth.split(' ')[1];
      const [user, pass] = atob(base64).split(':');
      return USERS[user] && USERS[user] === pass;
    }

    // Playlist endpoint
    if (url.pathname === '/playlist.m3u') {
      if (!checkAuth(request)) {
        return new Response('Unauthorized', {
          status: 401,
          headers: { 'WWW-Authenticate': 'Basic realm="IPTV"' }
        });
      }
      
      const res = await fetch(ORIGIN_M3U);
      let content = await res.text();
      const proxyUrl = `${url.protocol}//${url.host}`;
      const newContent = content.replace(/(https?:\/\/[^\s]+?\.m3u8[^\s]*)/g, `${proxyUrl}/proxy?url=$1`);
      
      return new Response(newContent, {
        headers: { 'Content-Type': 'application/vnd.apple.mpegurl' }
      });
    }

    // Proxy endpoint
    if (url.pathname === '/proxy') {
      const targetUrl = url.searchParams.get('url');
      if (!targetUrl) return new Response('Bad Request', { status: 400 });
      const stream = await fetch(targetUrl);
      return new Response(stream.body, {
        headers: { 'Content-Type': 'video/vnd.dlna.mpeg-http' }
      });
    }

    return new Response('IPTV Proxy is running. Use /playlist.m3u', { status: 200 });
  }
};
