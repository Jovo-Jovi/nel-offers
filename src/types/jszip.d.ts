declare module "jszip" {
  interface ZipLoader {
    loadAsync(data: Uint8Array): Promise<Record<string, unknown>>;
  }

  const JSZip: ZipLoader;
  export default JSZip;
}
