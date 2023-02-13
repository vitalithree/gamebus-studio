import { Operator } from './challenge.model';
import { DataProvider } from './data-provider.model';


export class ActivityScheme {
  id: number;
  translationKey: string;
  image: string;
  type: string;
  // miniGames: any[];
  isAggregate?: boolean;
  propertyPermissions?: PropertyPermission[];
}

export class PropertyPermission {
  id: number;
  index?: number;
  lastUpdate?: number;
  decisionNote?: any;
  state: string;
  property?: Property;
  dataProvider: DataProvider;
  allowedValues: AllowedValue[];
}

export class Property {
  id: number;
  translationKey: string;
  baseUnit: string;
  inputType: string;
  aggregationStrategy: string;
  propertyType: PropertyType;
  propertyPermissions?: PropertyPermission[];
}

export interface PropertyType {
  id: number;
  type: string;
  operators: Operator[];
}

export interface AllowedValue {
  index: number;
  translationKey: string;
  enumValue: string;
}
