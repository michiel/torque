import { useState, useEffect } from 'react';
import { componentRegistry, ComponentPlugin } from '../components/LayoutEditor/ComponentRegistry';

/**
 * Hook for accessing and managing component registry
 */
export function useComponentRegistry() {
  const [plugins, setPlugins] = useState<ComponentPlugin[]>(() => componentRegistry.getAll());

  useEffect(() => {
    // Subscribe to registry changes
    const unsubscribe = componentRegistry.subscribe((updatedPlugins) => {
      setPlugins(updatedPlugins);
    });

    return unsubscribe;
  }, []);

  return {
    plugins,
    register: componentRegistry.register.bind(componentRegistry),
    unregister: componentRegistry.unregister.bind(componentRegistry),
    getById: componentRegistry.getById.bind(componentRegistry),
    getByCategory: componentRegistry.getByCategory.bind(componentRegistry),
    search: componentRegistry.search.bind(componentRegistry),
    validateConfiguration: componentRegistry.validateConfiguration.bind(componentRegistry)
  };
}

/**
 * Hook for filtering components by category
 */
export function useComponentsByCategory(category?: string) {
  const { plugins } = useComponentRegistry();

  const filteredPlugins = category 
    ? plugins.filter(plugin => plugin.category === category)
    : plugins;

  return filteredPlugins;
}

/**
 * Hook for searching components
 */
export function useComponentSearch(query: string) {
  const { plugins } = useComponentRegistry();

  const searchResults = query.trim()
    ? plugins.filter(plugin => 
        plugin.label.toLowerCase().includes(query.toLowerCase()) ||
        plugin.description.toLowerCase().includes(query.toLowerCase()) ||
        plugin.type.toLowerCase().includes(query.toLowerCase())
      )
    : plugins;

  return searchResults;
}

/**
 * Hook for getting a specific component plugin
 */
export function useComponentPlugin(id: string) {
  const [plugin, setPlugin] = useState<ComponentPlugin | null>(() => 
    componentRegistry.getById(id)
  );

  useEffect(() => {
    const unsubscribe = componentRegistry.subscribe(() => {
      setPlugin(componentRegistry.getById(id));
    });

    return unsubscribe;
  }, [id]);

  return plugin;
}