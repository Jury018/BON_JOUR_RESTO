export default function middleware(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Paths accessible by both guests and authenticated users
  const guestPaths = [
    '/html/foodmenu.html',
    '/html/cart.html'
  ];

  // Paths strictly requiring full authentication (no guests)
  const fullAuthPaths = [
    '/html/checkout.html',
    '/html/rating.html'
  ];

  const isGuestPath = guestPaths.some(path => pathname.endsWith(path));
  const isFullAuthPath = fullAuthPaths.some(path => pathname.endsWith(path));

  if (isGuestPath || isFullAuthPath) {
    const cookieHeader = request.headers.get('cookie') || '';
    const sessionCookie = cookieHeader.split('; ').find(row => row.startsWith('resto_session='));
    const sessionValue = sessionCookie ? sessionCookie.split('=')[1] : null;

    if (!sessionValue) {
      // No session at all, redirect to login
      return Response.redirect(new URL('/html/login.html', request.url));
    }

    if (isFullAuthPath && sessionValue !== 'true') {
      // Guest trying to access checkout/rating, redirect to login
      return Response.redirect(new URL('/html/login.html', request.url));
    }
  }

  return;
}

export const config = {
  matcher: ['/html/:path*'],
};
