import React, { Suspense, ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

interface WithLazyLoadProps {
    [key: string]: any;
}

export const WithLazyLoad = <P extends object>(
    Component: ComponentType<P>,
    LoadingMessage: string = 'Loading...'
) => {
    const LazyComponent = (props: P) => (
        <Suspense
            fallback={
                <div className="flex flex-col items-center justify-center p-8 text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mb-2 text-indigo-500" />
                    <p className="text-xs font-medium">{LoadingMessage}</p>
                </div>
            }
        >
            <Component {...props} />
        </Suspense>
    );

    LazyComponent.displayName = `Lazy(${Component.displayName || Component.name || 'Component'})`;
    return LazyComponent;
};
