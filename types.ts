
export interface TrimSize {
  name: string;
  widthInches: number;
  heightInches: number;
}

export type ManuscriptPartType = 'Copyright' | 'Dedication' | 'Epigraph' | 'Table of Contents' | 'Preface' | 'Part' | 'Chapter';

export interface ManuscriptPart {
  id: string;
  type: ManuscriptPartType;
  title: string;
  content: string;
}

export interface CopyrightSettings {
  penName: string;
  edition: string;
  year: string;
  isbns: { epub: string; kindle: string; paperback: string; hardcover: string; pdf: string };
  publisherName: string;
  publisherLogo: string | null; // base64
  clauses: {
    allRightsReserved: boolean;
    fiction: boolean;
    moralRights: boolean;
    externalContent: boolean;
    designations: boolean;
    custom: string;
  };
}

export type BookTheme = 'Classic' | 'Reedsy' | 'Romance';

export interface ExportSettings {
    theme: BookTheme;
    useDropCaps: boolean;
    hideChapterNumbers: boolean;
}

export interface BookSettings {
  title: string;
  subtitle: string;
  author: string;
  trimSize: TrimSize;
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  includeTOC: boolean;
}

export interface Book {
    id: string;
    title: string;
    author: string;
    lastModified: number;
    settings: BookSettings;
    manuscriptParts: ManuscriptPart[];
    copyright: CopyrightSettings;
    exportSettings: ExportSettings;
    coverDesign: any; // Simplified for now
    achievements: string[];
}


// Legacy Chapter type for components that haven't been fully migrated
export interface Chapter {
  title: string;
  content: string;
}
