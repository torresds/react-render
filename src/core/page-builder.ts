import React, { ReactElement } from "react";
import ReactDOMServer from "react-dom/server";
import fs from "fs/promises";

type ReactPage = {
  title: string;
  metaTags?: MetaTag[];
  page: ReactElement;
  imports?: string[];
};

export type MetaTag = {
  [key: string]: string;
};

export class PageBuilder {
  private _cache: Map<string, string> = new Map();
  constructor() {
    this.readLocalCache();
  }

  private importsToTags = (imports: string[]) => {
    const tags: string[] = [];
    for (const imp of imports) {
      if (imp.endsWith(".css")) {
        tags.push(`<link rel="stylesheet" href="${imp}" />`);
      } else if (imp.endsWith(".js")) {
        tags.push(`<script src="${imp}"></script>`);
      } else {
        console.error(`Unsupported import type: ${imp}`);
      }
    }
    return tags;
  };

  private readLocalCache = async () => {
    try {
      if (!(await fs.stat("./cache")).isDirectory()) {
        await fs.mkdir("./cache");
      }
      const cachedLocalPages = await fs.readdir("./cache");
      for (const page of cachedLocalPages) {
        const content = await fs.readFile(`./cache/${page}`, "utf-8");
        this._cache.set(page, content);
      }
      console.log("Local cache read successfully");
    } catch (err) {
      console.error(err);
    }
  };

  public buildPage = async (page: string) => {
    if (this._cache.has(page)) {
      return this._cache.get(page);
    }
    const ReactPage = await import(`./pages/${page}`);

    let head = ``;
    if (ReactPage.metaTags) {
      for (const tag of ReactPage.metaTags) {
        head += `<meta ${Object.keys(tag)
          .map((key) => `${key}="${tag[key]}"`)
          .join(" ")} />`;
      }
    }

    const pageImports: string[] =
      ReactPage.imports && ReactPage.length
        ? this.importsToTags(ReactPage.imports)
        : [];

    const PageContent = `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${head}
      <title>${ReactPage.title}</title>
      ${ReactPage.imports.length > 0 ? ReactPage.imports.join("\n") : ""}
      ${pageImports.filter((imp) => imp.endsWith(".css")).join("\n")}
      </head>
      <body>
        <div id="root">${ReactDOMServer.renderToString(ReactPage.page)}</div>
        ${pageImports.filter((imp) => imp.endsWith(".js")).join("\n")}
        </body>
        </html>
      `;
    this._cache.set(page, PageContent);
    await fs.writeFile(`./cache/${page}.html`, PageContent);
    return PageContent;
  };
}
