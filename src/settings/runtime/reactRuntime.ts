import { sleep } from '../shared';

export let React: any;
export let ReactDOM: any;

export async function awaitReact() {
  while (!(window as any).SpotiKit?.React || !(window as any).SpotiKit?.ReactDOM) await sleep(200);
  React = SpotiKit.React;
  ReactDOM = SpotiKit.ReactDOM;
}

export async function awaitPlayer(timeoutMs = 10000) {
  const start = Date.now();
  const ready = () => !!(window as any).SpotiKit?.Player?.service;
  while (!ready() && Date.now() - start < timeoutMs) await sleep(200);
}
