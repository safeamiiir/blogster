import jsyaml from "js-yaml";
import datefns from "date-fns";
import type {
  MarkdownPostFrontmatter,
  ExternalPostFrontmatter,
  ProjectFrontmatter,
  FrontmatterType,
  ContentType,
} from "./types";

const { load } = jsyaml;
const { isMatch, format, parse } = datefns;
const dateFormat = "yyyy-MM-dd";

function validateDefaultFrontmatter(frontmatter: Record<string, unknown>) {
  if (Object.keys(frontmatter).length < 1) {
    throw new Error("Frontmatter should be an object with keys");
  }

  if (typeof frontmatter.title !== "string") {
    throw new Error("Frontmatter.title is missing. String expected.");
  }

  if (
    typeof frontmatter.date !== "string" &&
    !((frontmatter.date as any) instanceof Date)
  ) {
    throw new Error(
      "Frontmatter.date is missing. Date expected in format yyyy-MM-dd."
    );
  } else {
    if (typeof frontmatter.date === "string") {
      frontmatter.date = parse(frontmatter.date, dateFormat, new Date());
      const formattedDate = format(frontmatter.date as Date, dateFormat);
      if (!isMatch(formattedDate, dateFormat)) {
        throw new Error(
          "Frontmatter.date is not a valid date string. Date expected in format yyyy-MM-dd."
        );
      }
    } else if ((frontmatter.date as any) instanceof Date) {
      const formattedDate = format(frontmatter.date as Date, dateFormat);
      if (!isMatch(formattedDate, dateFormat)) {
        throw new Error(
          "Frontmatter.date is not a valid date string. Date expected in format yyyy-MM-dd."
        );
      }
    }
  }

  return frontmatter;
}

function validateBlogFrontmatter(frontmatter: Record<string, unknown>) {
  frontmatter = validateDefaultFrontmatter(frontmatter);

  if (
    frontmatter.isExternal === "true" ||
    frontmatter.isExternal === true ||
    frontmatter.url
  ) {
    if (typeof frontmatter.url !== "string") {
      throw new Error(
        "Frontmatter.url is missing. Posts marked (isExternal: true) should have a url."
      );
    }

    return {
      ...frontmatter,
      type: "blog",
      isExternal: true,
    } as ExternalPostFrontmatter;
  }

  // description is important for og:description
  // if (typeof frontmatter.description !== "string") {
  //   throw new Error("Frontmatter.description is missing. String expected.");
  // }

  return {
    ...frontmatter,
    type: "blog",
    isExternal: false,
  } as MarkdownPostFrontmatter;
}

function validateProjectFrontmatter(frontmatter: Record<string, unknown>) {
  frontmatter = validateDefaultFrontmatter(frontmatter);

  if (typeof frontmatter.url !== "string") {
    throw new Error("Frontmatter.url is missing. String expected.");
  }

  return {
    ...frontmatter,
    type: "project",
  } as ProjectFrontmatter;
}

export const validateFrontmatter = ({
  type,
  frontmatter,
}: {
  type: ContentType;
  frontmatter: Record<string, unknown>;
}): FrontmatterType => {
  if (type === "blog") {
    return validateBlogFrontmatter(frontmatter);
  } else if (type === "project") {
    return validateProjectFrontmatter(frontmatter);
  } else {
    throw new Error("Frontmatter validator not defined for type: ", type);
  }
};

export function extractFrontmatter(content: string) {
  const frontMatterPattern = /^---[\s]+([\s\S]*?)[\s]+---/;
  const match = frontMatterPattern.exec(content);
  if (!match) {
    throw new Error(
      "Expected post to contain frontmatter with a title, description and publishDate"
    );
  }
  const frontmatter = match[1];
  let parsed;
  try {
    parsed = load(frontmatter);
  } catch (err) {
    throw new Error(`Failed to parse frontmatter as yaml: ${err}`);
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error(
      `Expected frontmatter yaml to be an object but found:\n${JSON.stringify(
        parsed
      )}`
    );
  }
  let obj = parsed as Record<string, unknown>;
  return obj;
}