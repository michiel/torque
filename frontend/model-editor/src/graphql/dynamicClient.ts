import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { getTorqueConfig } from '../utils/tauriConfig';

let apolloClientInstance: ApolloClient<any> | null = null;

const createDynamicClient = async () => {
  const config = await getTorqueConfig();

  // HTTP link to GraphQL endpoint with dynamic URL
  const httpLink = createHttpLink({
    uri: config.graphqlUrl,
  });

  // Auth link for future authentication
  const authLink = setContext((_, { headers }) => {
    // Get the authentication token from local storage if it exists
    const token = localStorage.getItem('torque_auth_token');
    
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      }
    };
  });

  // Apollo Client instance
  return new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            models: {
              merge: false,
            },
          },
        },
        Model: {
          fields: {
            entities: {
              merge: false,
            },
            relationships: {
              merge: false,
            },
            flows: {
              merge: false,
            },
            layouts: {
              merge: false,
            },
            validations: {
              merge: false,
            },
          },
        },
      },
    }),
    defaultOptions: {
      watchQuery: {
        errorPolicy: 'ignore',
      },
      query: {
        errorPolicy: 'all',
      },
    },
  });
};

// Get or create the Apollo client instance
export const getDynamicApolloClient = async (): Promise<ApolloClient<any>> => {
  if (!apolloClientInstance) {
    apolloClientInstance = await createDynamicClient();
  }
  return apolloClientInstance;
};

// For compatibility with existing code, export the client promise
export const dynamicApolloClient = getDynamicApolloClient();