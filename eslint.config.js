import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import airbnbConfig from 'eslint-config-airbnb';
import importPlugin from 'eslint-plugin-import';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';


export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    
    ...js.configs.recommended, 
    
    plugins: {
      ...js.configs.recommended.plugins,
      import: importPlugin,
      'jsx-a11y': jsxA11yPlugin,
      react: reactPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    
    rules: {
      ...js.configs.recommended.rules, // Reglas base
      ...airbnbConfig.rules, // Reglas de Airbnb
      ...reactHooks.configs.recommended.rules, // Reglas de Hooks
      'react-refresh/only-export-components': 'warn', // Regla de Vite
      
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'react/react-in-jsx-scope': 'off', 
      'react/prop-types': 'off', 
    },
    
    settings: airbnbConfig.settings || {}, 
    
    languageOptions: {
      ...airbnbConfig.languageOptions, 
      
      parserOptions: {
        ...(airbnbConfig.languageOptions?.parserOptions || {}),
        ecmaFeatures: {
          ...(airbnbConfig.languageOptions?.parserOptions?.ecmaFeatures || {}),
          jsx: true,
        },
      },
      
      globals: {
        ...globals.browser,
      },
    },
  },
]);