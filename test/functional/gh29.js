import {createTarballHash} from "../../src/lib/crypto-utils";

function readfile(x) {
  return require('fs').readFileSync(__dirname + '/' + x);
}

const binary = 'fixtures/binary';
const pkgName = 'testpkg-gh29';
const pkgContent = 'blahblah';

export default function (server, server2) {

  test('downloading non-existent tarball #1 / srv2', () => {
    return server2.getTarball(pkgName, pkgContent)
             .status(404)
             .body_error(/no such package/);
  });

  describe('pkg-gh29', () => {


    beforeAll(function() {
      return server.putPackage(pkgName, require('./fixtures/package')(pkgName))
               .status(201)
               .body_ok(/created new package/);
    });

    test('creating new package / srv1', () => {});

    test('downloading non-existent tarball #2 / srv2', () => {
      return server2.getTarball(pkgName, pkgContent)
               .status(404)
               .body_error(/no such file available/);
    });

    describe('tarball', () => {
      beforeAll(function() {
        return server.putTarball(pkgName, pkgContent, readfile(binary))
                 .status(201)
                 .body_ok(/.*/);
      });

      test('uploading new tarball / srv1', () => {});

      describe('pkg version', () => {
        beforeAll(function() {
          const pkg = require('./fixtures/package')(pkgName);
          pkg.dist.shasum = createTarballHash().update(readfile(binary)).digest('hex');
          return server.putVersion(pkgName, '0.0.1', pkg)
                   .status(201)
                   .body_ok(/published/);
        });

        test('uploading new package version / srv1', () => {});

        test('downloading newly created tarball / srv2', () => {
          return server2.getTarball(pkgName, pkgContent)
                 .status(200)
                 .then(function(body) {
                   expect(body).toEqual(readfile(binary));
                 });
        });
      });
    });
  });
}
