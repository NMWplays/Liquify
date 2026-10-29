type AnyReact = any;

declare const window: any;

function getReact(): AnyReact {
  return window?.SpotiKit?.React || window?.React;
}

function requireReact(): AnyReact {
  const react = getReact();
  if (!react) throw new Error('SpotiKit.React is not ready yet');
  return react;
}

const ReactFacade: AnyReact = {
  memo(component: any, compare?: any) {
    const react = getReact();
    return react?.memo ? react.memo(component, compare) : component;
  },
  forwardRef(render: any) {
    const react = getReact();
    return react?.forwardRef ? react.forwardRef(render) : render;
  },
  createElement(...args: any[]) {
    return requireReact().createElement(...args);
  },
  get Fragment() {
    return getReact()?.Fragment || ((props: any) => props?.children);
  },
};

export default ReactFacade;

export const Fragment = (props: any) => {
  const fragment = getReact()?.Fragment;
  return fragment ? fragment(props) : props?.children;
};

export function createElement(...args: any[]) {
  return requireReact().createElement(...args);
}

export function useState<T>(initial: T | (() => T)) {
  return requireReact().useState(initial);
}

export function useEffect(effect: any, deps?: any) {
  return requireReact().useEffect(effect, deps);
}

export function useLayoutEffect(effect: any, deps?: any) {
  const react = requireReact();
  return (react.useLayoutEffect || react.useEffect)(effect, deps);
}

export function useMemo(factory: any, deps?: any) {
  return requireReact().useMemo(factory, deps);
}

export function useRef<T>(initial: T) {
  return requireReact().useRef(initial);
}

export function useCallback(fn: any, deps?: any) {
  return requireReact().useCallback(fn, deps);
}

export function useContext(ctx: any) {
  return requireReact().useContext(ctx);
}

export function memo(component: any, compare?: any) {
  const react = getReact();
  return react?.memo ? react.memo(component, compare) : component;
}

export function forwardRef(render: any) {
  const react = getReact();
  return react?.forwardRef ? react.forwardRef(render) : render;
}
