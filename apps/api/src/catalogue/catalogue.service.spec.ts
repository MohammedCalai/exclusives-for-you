import 'reflect-metadata';
import { ProductSort } from './catalogue.dto';

describe('ProductSort', () => {
  it('exposes every supported customer sort', () => {
    expect(Object.values(ProductSort)).toEqual(['newest', 'price_asc', 'price_desc', 'saving']);
  });
});
