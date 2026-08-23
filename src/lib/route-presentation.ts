export type PrimaryRouteTab = 'today' | 'learn' | 'words' | 'more'

export interface RoutePresentation {
  title: string
  tab: PrimaryRouteTab
}

function matches(pathname: string, path: string): boolean {
  return pathname === path || pathname.startsWith(`${path}/`)
}

export function getRoutePresentation(pathname: string): RoutePresentation {
  if (pathname === '/') return { title: '今日', tab: 'today' }
  if (matches(pathname, '/today')) return { title: '今日学习', tab: 'today' }
  if (matches(pathname, '/learn') || matches(pathname, '/study')) return { title: '学习', tab: 'learn' }
  if (matches(pathname, '/review')) return { title: '复习', tab: 'learn' }
  if (matches(pathname, '/dictation')) return { title: '听写', tab: 'learn' }
  if (matches(pathname, '/mistakes')) return { title: '薄弱词', tab: 'learn' }
  if (matches(pathname, '/words') || matches(pathname, '/word')) return { title: '词库', tab: 'words' }
  if (matches(pathname, '/stats')) return { title: '统计', tab: 'more' }
  if (matches(pathname, '/settings')) return { title: '设置', tab: 'more' }
  if (matches(pathname, '/more')) return { title: '更多', tab: 'more' }
  return { title: '学习', tab: 'learn' }
}

export function isRouteActive(to: string, pathname: string): boolean {
  if (to === '/' || to === '/learn' || to === '/words' || to === '/more') {
    const tab = to === '/' ? 'today' : to === '/learn' ? 'learn' : to === '/words' ? 'words' : 'more'
    return getRoutePresentation(pathname).tab === tab
  }
  return matches(pathname, to)
}
