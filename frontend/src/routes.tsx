import type { RouteRecord } from 'vite-react-ssg'
import Layout from './components/layout/Layout'
import { getPosts, getProjects } from './lib/api'

export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, lazy: () => import('./pages/Home') },
      { path: 'loyihalar', lazy: () => import('./pages/Projects') },
      {
        path: 'loyihalar/:slug',
        lazy: () => import('./pages/ProjectDetail'),
        getStaticPaths: async () => (await getProjects()).map((p) => `loyihalar/${p.slug}`),
      },
      { path: 'xizmatlar', lazy: () => import('./pages/Services') },
      { path: 'narxlar', lazy: () => import('./pages/Pricing') },
      { path: 'mahsulotlar', lazy: () => import('./pages/Products') },
      { path: 'haqimda', lazy: () => import('./pages/About') },
      { path: 'blog', lazy: () => import('./pages/Blog') },
      {
        path: 'blog/:slug',
        lazy: () => import('./pages/BlogPost'),
        getStaticPaths: async () => (await getPosts()).map((p) => `blog/${p.slug}`),
      },
      { path: 'aloqa', lazy: () => import('./pages/Contact') },
      { path: 'boshqaruv', lazy: () => import('./pages/Admin') },
      { path: '*', lazy: () => import('./pages/NotFound') },
    ],
  },
]
