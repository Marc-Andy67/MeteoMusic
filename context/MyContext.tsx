import React, { createContext, useContext, useState } from 'react';

interface ContextType {
    value: string;
    setValue: (value: string) => void;
}

const MyContext = createContext<ContextType | undefined>(undefined);

export function MyContextProvider({ children }: { children: React.ReactNode }) {
    const [value, setValue] = useState<string>('Hello World');
    return (
        <MyContext.Provider value={{ value, setValue }}>
            {children}
        </MyContext.Provider>
    );
}

export function useMyContext() {
    const context = useContext(MyContext);
    if (!context) throw new Error('useMyContext must be used within MyContextProvider');
    return context;
}