import { locationFromUrl } from './locationFromUrl';


describe('locationFromUrl', () => {
  it('works correctly', () => {
    let location;
    location = locationFromUrl('/abc?qwe#123');
    expect(location).toEqual({ pathname: '/abc', search: '?qwe', hash: '#123', state: {} });

    location = locationFromUrl('/abc#123');
    expect(location).toEqual({ pathname: '/abc', search: '', hash: '#123', state: {} });

    location = locationFromUrl('/abc');

    expect(location).toEqual({ pathname: '/abc', search: '', hash: '', state: {} });

    location = locationFromUrl('');
    expect(location).toEqual({ pathname: '', search: '', hash: '', state: {} });
  });
});
