import React, { createContext, useContext, useState } from 'react';

// Create the Context
interface ContextType {
    value: string;
    setValue: (value: string) => void;
}

const MyContext = createContext<ContextType | undefined>(undefined);

// Provider Component
export function MyContextProvider({ children }: { children: React.ReactNode }) {
    const [value, setValue] = useState<string>('Hello World');

    return (
        <MyContext.Provider value={{ value, setValue }}>
            {children}
        </MyContext.Provider>
    );
}

// Custom Hook to use the Context
export function useMyContext() {
    const context = useContext(MyContext);
    if (!context) {
        throw new Error('useMyContext must be used within MyContextProvider');
    }
    return context;
}

// Consumer Component 1
export function ComponentA() {
    const { value } = useMyContext();
    return <div>Value from Context: {value}</div>;
}

// Consumer Component 2
export function ComponentB() {
    const { setValue } = useMyContext();
    return (
        <button onClick={() => setValue('Updated Value')}>
            Update Context
        </button>
    );
}

// App Component
export function App() {
    return (
        <MyContextProvider>
            <ComponentA />
            <ComponentB />
        </MyContextProvider>
    );
}