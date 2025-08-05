# Modern React Patterns and Best Practices

React has evolved significantly over the years. Let's explore modern patterns that make your applications more maintainable and performant.

## Custom Hooks

Custom hooks let you extract component logic into reusable functions:

```tsx
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue] as const;
}
```

## Context for State Management

Use React Context for global state:

```tsx
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

## Performance Optimization

### React.memo for Component Memoization

```tsx
const ExpensiveComponent = React.memo(({ data, onUpdate }) => {
  // Expensive computations here
  return <div>{/* render logic */}</div>;
});
```

### useMemo and useCallback

```tsx
function MyComponent({ items, filter }) {
  const filteredItems = useMemo(() => 
    items.filter(item => item.category === filter),
    [items, filter]
  );

  const handleClick = useCallback((id) => {
    // Handle click logic
  }, []);

  return (
    <div>
      {filteredItems.map(item => (
        <Item key={item.id} data={item} onClick={handleClick} />
      ))}
    </div>
  );
}
```

These patterns help create more maintainable and performant React applications.