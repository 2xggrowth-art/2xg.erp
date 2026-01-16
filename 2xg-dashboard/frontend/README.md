# 2XG Dashboard - Frontend

React + TypeScript + Tailwind CSS frontend for the 2XG Custom Dashboard.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Chart library for data visualization
- **Lucide React** - Icon library
- **Axios** - HTTP client

## Project Structure

```
src/
├── components/
│   ├── layout/           # Layout components
│   │   ├── DashboardLayout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── MainContent.tsx
│   ├── dashboard/        # Dashboard widgets
│   │   └── MetricCard.tsx
│   ├── common/           # Shared components
│   │   └── DateRangeFilter.tsx
│   └── modules/          # Module-specific components
│       ├── ERPModule.tsx
│       ├── LogisticsModule.tsx
│       ├── CAREModule.tsx
│       └── CRMModule.tsx
├── contexts/             # React Context
│   └── DateFilterContext.tsx
├── services/             # API services
│   ├── api.client.ts
│   ├── erp.service.ts
│   ├── logistics.service.ts
│   ├── care.service.ts
│   └── crm.service.ts
├── types/                # TypeScript types
│   └── index.ts
├── App.tsx               # Root component
├── main.tsx              # Entry point
└── index.css             # Global styles
```

## Available Scripts

### `npm run dev`

Runs the development server at [http://localhost:3000](http://localhost:3000)

### `npm run build`

Builds the app for production to the `dist/` folder.

### `npm run preview`

Preview the production build locally.

## Component Architecture

### Layout Hierarchy

```
App
└── DateFilterProvider (Context)
    └── DashboardLayout
        ├── Sidebar
        ├── Header
        └── MainContent
            ├── DateRangeFilter
            ├── ERPModule
            ├── LogisticsModule
            ├── CAREModule
            └── CRMModule
```

### Data Flow

1. **Date Selection**: User clicks a date preset (e.g., "This Month")
2. **Context Update**: `DateFilterContext` updates global state
3. **Module Re-fetch**: All modules listen to context changes via `useEffect`
4. **API Calls**: Each module calls its respective API service
5. **UI Update**: Components re-render with new data

## State Management

We use **React Context API** for global state management:

- **DateFilterContext**: Manages the global date range
- Local component state: Manages module-specific data and loading states

## Styling

### Tailwind CSS

All styles use Tailwind utility classes. Custom colors are defined in `tailwind.config.js`:

```javascript
colors: {
  'sidebar-dark': '#1e293b',  // Sidebar background
}
```

### Responsive Breakpoints

- `sm`: 640px (mobile landscape)
- `md`: 768px (tablet)
- `lg`: 1024px (desktop)
- `xl`: 1280px (large desktop)

## API Integration

All API calls use the centralized `apiClient` (Axios instance) configured in `services/api.client.ts`.

### Adding a New API Endpoint

1. Add types to `src/types/index.ts`
2. Create/update service in `src/services/`
3. Use in component with `useEffect` and state

Example:

```typescript
// 1. Add type
export interface NewData {
  id: string;
  value: number;
}

// 2. Add service method
export const newService = {
  getData: (): Promise<APIResponse<NewData[]>> =>
    apiClient.get('/new/endpoint')
};

// 3. Use in component
const [data, setData] = useState<NewData[]>([]);

useEffect(() => {
  const fetchData = async () => {
    const response = await newService.getData();
    setData(response.data);
  };
  fetchData();
}, []);
```

## Environment Variables

Create a `.env` file:

```
VITE_API_URL=http://localhost:5000/api
```

Access in code:

```typescript
import.meta.env.VITE_API_URL
```

## Adding a New Module

1. Create component in `src/components/modules/NewModule.tsx`
2. Create API service in `src/services/new.service.ts`
3. Add types to `src/types/index.ts`
4. Add navigation item to `Sidebar.tsx`
5. Import and render in `App.tsx`

## Icons

We use **Lucide React** for icons. Browse available icons at [lucide.dev](https://lucide.dev)

Usage:

```tsx
import { IconName } from 'lucide-react';

<IconName size={20} className="text-blue-600" />
```

## Charts

We use **Recharts** for data visualization. Example:

```tsx
import { BarChart, Bar, XAxis, YAxis } from 'recharts';

<BarChart data={chartData}>
  <XAxis dataKey="category" />
  <YAxis />
  <Bar dataKey="value" fill="#3b82f6" />
</BarChart>
```

## Best Practices

1. **TypeScript**: Always type your props, state, and API responses
2. **Reusable Components**: Extract common UI patterns
3. **Error Handling**: Wrap API calls in try-catch and show user-friendly errors
4. **Loading States**: Always show loading indicators during data fetch
5. **Responsive**: Test on mobile, tablet, and desktop
6. **Accessibility**: Use semantic HTML and ARIA attributes

## Performance Optimization

- Components use `React.memo` where appropriate
- API calls are debounced/throttled as needed
- Images are lazy-loaded
- Production build is code-split automatically by Vite

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Set environment variable: `VITE_API_URL=your-production-api-url`
4. Deploy!

### Other Platforms

Build the project:

```bash
npm run build
```

Deploy the `dist/` folder to any static hosting service (Netlify, AWS S3, etc.)

## Troubleshooting

### Blank page after build

Check browser console for errors. Likely causes:
- Wrong `VITE_API_URL` in production
- CORS issues with backend

### Styles not applying

- Run `npm install` again
- Clear cache and restart dev server
- Check `tailwind.config.js` paths

### API calls failing

- Verify backend is running
- Check `.env` file has correct `VITE_API_URL`
- Open Network tab in browser DevTools

## License

MIT
