export interface PackageInfo {
  id: string;
  title: string;
  expiration: Date;
  size: number;
}

export interface PackageMetadata extends PackageInfo {
  files: FileMetadata[];
}

export interface FileMetadata {
  url: string;
  fileName: string;
}
