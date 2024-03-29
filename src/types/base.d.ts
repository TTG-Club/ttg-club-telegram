export type TNameValue<T = string> = {
  name: string;
  value: T;
};

export type TName = {
  rus: string;
  eng: string;
};

export type TSource = {
  shortName: string;
  name: string;
  homebrew?: boolean;
  page?: number;
};

export type TClassBadge = {
  name: string;
  url: string;
  icon: string;
};

export type TSubclassBadge = {
  name: string;
  url: string;
  class: string;
};

export type TRaceBadge = {
  name: string;
  url: string;
};

export type TBackgroundBadge = {
  name: string;
  url: string;
};

export type TPrice = {
  dmg: string;
  xge: string;
};

export type TType = {
  name: string;
  order: number;
};
