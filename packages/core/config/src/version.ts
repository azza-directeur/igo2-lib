export interface Version {
  app?: string;
  lib?: string;
  releaseDateApp?: number;
  releaseDate?: number;
}

export const version: Version = {
  lib: '17.0.0-next.13',
  releaseDate: 1717616688514
};
