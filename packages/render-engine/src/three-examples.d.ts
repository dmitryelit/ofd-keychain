declare module "three/addons/loaders/SVGLoader.js" {
  import { Shape, ShapePath } from "three";

  export class SVGLoader {
    parse(svg: string): { paths: ShapePath[] };
    static createShapes(path: ShapePath): Shape[];
  }
}
