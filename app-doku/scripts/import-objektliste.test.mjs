// node --test scripts/import-objektliste.test.mjs (Node 24)
// Echte Importerfunktionen, synthetischer Adapter; keine Prisma-/Produktivverbindung.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';
import { stripTypeScriptTypes } from 'node:module';

let source = fs.readFileSync(path.join(import.meta.dirname, 'import-objektliste.ts'), 'utf8');
source = source.replace(/^import .*;\r?\n/gm, '')
  .replace(/^const adapter = .*;\r?\n/m, '').replace(/^const prisma = .*;\r?\n/m, '');
const automaticCall = source.lastIndexOf('\nmain()');
assert.ok(automaticCall > 0, 'automatischen Produktivaufruf eindeutig entfernen');
source = stripTypeScriptTypes(source.slice(0, automaticCall));
const factory = new vm.Script('(function(prisma,process,console,mkdir,writeFile,path){' + source +
  ';return {parseArgs,ziele,plane,main};})').runInThisContext();
const copy = (x) => structuredClone(x);

function environment(options = {}) {
  const state = { rows: copy(options.rows ?? []), jobs: [], backups: [], committed: false,
    objectWrites: 0, errors: [], logs: [], options };
  const processStub = { argv: ['node', 'importer', ...(options.argv ?? [])], env: {}, exitCode: 0 };
  function objects(rows) {
    return {
      findMany: async () => copy(rows),
      create: async ({ data }) => {
        if (options.failObject && data.externeId === 'wincasa-003') throw Error('INJECTED_OBJECT_FAILURE');
        const result = { id: `new-${data.externeId}`, ...copy(data) };
        rows.push(result); state.objectWrites++; return copy(result);
      },
      updateMany: async ({ where, data }) => {
        if (options.concurrentEdit && where.id === 'id-16') {
          state.rows.find((r) => r.id === where.id).updatedAt = 'concurrent';
          rows.find((r) => r.id === where.id).updatedAt = 'concurrent';
        }
        const result = rows.find((r) => r.id === where.id && r.updatedAt === where.updatedAt);
        if (!result) return { count: 0 };
        Object.assign(result, copy(data)); state.objectWrites++; return { count: 1 };
      },
    };
  }
  function jobs(list, transactional = false) {
    return {
      create: async ({ data }) => {
        const result = { id: 'job-1', ...copy(data) }; list.push(result); return copy(result);
      },
      findUnique: async ({ where }) => {
        if (options.failStatusRead) throw Error('INJECTED_STATUS_READ_FAILURE');
        return copy(list.find((j) => j.id === where.id) ?? null);
      },
      update: async ({ data }) => {
        assert.equal(transactional, true, 'DONE muss innerhalb der Objekttransaktion liegen');
        if (options.failDone) throw Error('INJECTED_DONE_FAILURE');
        Object.assign(list[0], copy(data)); return copy(list[0]);
      },
      updateMany: async ({ where, data }) => {
        if (options.failFailureStatus) throw Error('INJECTED_FAILURE_STATUS_WRITE_FAILURE');
        const result = list.find((j) => j.id === where.id && j.status === where.status);
        if (!result) return { count: 0 };
        Object.assign(result, copy(data)); return { count: 1 };
      },
    };
  }
  const client = {
    objekt: objects(state.rows), importJob: jobs(state.jobs),
    $transaction: async (callback) => {
      const rows = copy(state.rows); const draftJobs = copy(state.jobs);
      const result = await callback({ objekt: objects(rows), importJob: jobs(draftJobs, true) });
      // Die aeusseren Clientmethoden muessen denselben committed Speicher sehen.
      state.rows.splice(0, state.rows.length, ...rows);
      state.jobs.splice(0, state.jobs.length, ...draftJobs);
      state.committed = true;
      if (options.failCommitAcknowledgement) throw Error('INJECTED_COMMIT_ACK_FAILURE');
      return result;
    },
  };
  const api = factory(client, processStub, {
    log: (line) => {
      if (options.failOutput && state.committed) throw Error('INJECTED_OUTPUT_FAILURE');
      state.logs.push(String(line));
    },
    error: (line) => state.errors.push(String(line)),
  }, async () => {}, async (file, data, flags) => {
    if (options.failBackup) throw Error('INJECTED_BACKUP_FAILURE');
    assert.equal(flags.flag, 'wx'); assert.equal(flags.mode, 0o600);
    state.backups.push({ file, data: JSON.parse(data) });
  }, path);
  return { state, process: processStub, api };
}

const targets = environment().api.ziele().ziele;
function existing(z) {
  return { id: `id-${z.nr}`, name: z.anzeige, strasse: z.strasseSauber, plz: z.plz, ort: z.ort,
    externeId: z.neueId, verwaltungsart: z.verwaltungsart, kontoart: z.kontoart,
    gesellschaft: z.gesellschaft, status: z.status, stammdatenQuelle: 'historical', updatedAt: 'before' };
}
const allRows = () => targets.map(existing);
const row16 = (e) => e.state.rows.find((r) => r.externeId === 'wincasa-016');

test('60 eindeutige Ziele, bestaetigte PLZ und Gesellschaft500', () => {
  assert.equal(targets.length, 60); assert.equal(new Set(targets.map((z) => z.nr)).size, 60);
  for (const [nr, plz] of [[15, '32139'], [16, '33609'], [38, '33649'], [200, '33649']]) {
    assert.equal(targets.find((z) => z.nr === nr).plz, plz);
  }
  assert.equal(targets.find((z) => z.nr === 500).gesellschaft, 'Immoquelle GmbH');
});
test('Probelauf ohne Objekt-/Job-/Dateiwrites', async () => {
  const e = environment(); await e.api.main();
  assert.equal(e.state.objectWrites, 0); assert.equal(e.state.jobs.length, 0); assert.equal(e.state.backups.length, 0);
});
test('Objektfreigabe verlangt explizite Feldfreigabe; ungueltige Flags abweisen', () => {
  const e = environment();
  for (const args of [['--uebernehmen=16'], ['--felder=plz'], ['--ausfuhren'],
    ['--uebernehmen=16', '--felder=unbekannt'], ['--uebernehmen=', '--felder=plz'],
    ['--uebernehmen=16,', '--felder=plz'], ['--uebernehmen=0', '--felder=plz'],
    ['--uebernehmen=16', '--uebernehmen=alle', '--felder=plz']]) {
    assert.throws(() => e.api.parseArgs(args));
  }
});
test('Unbekannte Objektnummer sperrt vor Jobanlage', async () => {
  const e = environment({ argv: ['--ausfuehren', '--uebernehmen=999', '--felder=plz'] });
  await assert.rejects(e.api.main(), /nicht in der Importliste/); assert.equal(e.state.jobs.length, 0);
});
test('PLZ-Konflikt sperrt auch neue Objekte und leere Klassifikationsfelder', async () => {
  const rows = allRows().filter((r) => r.externeId !== 'wincasa-003');
  rows.find((r) => r.id === 'id-16').plz = '33611'; rows.find((r) => r.id === 'id-16').kontoart = null;
  const e = environment({ rows, argv: ['--ausfuehren'] }); await e.api.main();
  assert.deepEqual(e.state.rows, rows); assert.equal(e.state.objectWrites, 0);
  assert.equal(e.state.jobs[0].status, 'FAILED'); assert.equal(e.process.exitCode, 1);
});
test('Probelauf mit Konflikt bleibt schreibfrei und signalisiert Sperre', async () => {
  const rows = allRows(); rows[0].plz = 'manual'; const e = environment({ rows }); await e.api.main();
  assert.equal(e.process.exitCode, 1); assert.equal(e.state.jobs.length, 0); assert.deepEqual(e.state.rows, rows);
});
test('Explizite Feldfreigabe setzt ausschliesslich PLZ016', async () => {
  const rows = allRows(); rows.find((r) => r.id === 'id-16').plz = '33611';
  const e = environment({ rows, argv: ['--ausfuehren', '--uebernehmen=16', '--felder=plz'] });
  await e.api.main(); assert.equal(row16(e).plz, '33609'); assert.equal(e.state.jobs[0].status, 'DONE');
  assert.equal(e.state.backups[0].data.vorwerte[0].plz, '33611');
  const expected = copy(rows); expected.find((r) => r.id === 'id-16').plz = '33609';
  expected.find((r) => r.id === 'id-16').stammdatenQuelle = row16(e).stammdatenQuelle;
  assert.deepEqual(e.state.rows, expected);
});
test('PLZ-Freigabe ueberschreibt keine abweichende manuelle Strasse', async () => {
  const rows = allRows(); const r = rows.find((x) => x.id === 'id-16');
  r.plz = '33611'; r.strasse = 'Manuell bestaetigte Strasse';
  const e = environment({ rows, argv: ['--ausfuehren', '--uebernehmen=16', '--felder=plz'] });
  await e.api.main(); assert.deepEqual(e.state.rows, rows); assert.equal(e.state.objectWrites, 0);
});
test('Fehler am DONE-Update rollt Objektwrites gemeinsam zurueck', async () => {
  const e = environment({ argv: ['--ausfuehren'], failDone: true }); await e.api.main();
  assert.equal(e.state.rows.length, 0); assert.equal(e.state.committed, false);
  assert.equal(e.state.jobs[0].status, 'FAILED');
});
test('Commitbestaetigung verloren: gespeichertes DONE bleibt erhalten', async () => {
  const e = environment({ argv: ['--ausfuehren'], failCommitAcknowledgement: true }); await e.api.main();
  assert.equal(e.state.rows.length, 60); assert.equal(e.state.jobs[0].status, 'DONE');
  assert.match(e.state.errors.join('\n'), /DONE nachgelesen/);
  assert.doesNotMatch(e.state.errors.join('\n'), /nichts geaendert|zurueckgerollt/);
});
test('Commitbestaetigung und Statuszugriff verloren: Ergebnis ausdruecklich unklar', async () => {
  const e = environment({ argv: ['--ausfuehren'], failCommitAcknowledgement: true, failStatusRead: true });
  await e.api.main(); assert.equal(e.state.jobs[0].status, 'DONE');
  assert.match(e.state.errors.join('\n'), /Ergebnis unklar/); assert.equal(e.process.exitCode, 1);
});
test('Ausgabefehler nach Commit aendert DONE nicht', async () => {
  const e = environment({ argv: ['--ausfuehren'], failOutput: true });
  await assert.rejects(e.api.main(), /OUTPUT_FAILURE/); assert.equal(e.state.jobs[0].status, 'DONE');
  assert.equal(e.state.rows.length, 60);
});
test('Fehler mitten in Objektwrites hinterlaesst keine Teilobjekte', async () => {
  const e = environment({ argv: ['--ausfuehren'], failObject: true }); await e.api.main();
  assert.equal(e.state.rows.length, 0); assert.equal(e.state.committed, false);
});
test('Vorwertsicherung fehlgeschlagen: keine Objektwrites', async () => {
  const rows = allRows(); rows.find((r) => r.id === 'id-16').plz = '33611';
  const e = environment({ rows, argv: ['--ausfuehren', '--uebernehmen=16', '--felder=plz'], failBackup: true });
  await e.api.main(); assert.deepEqual(e.state.rows, rows); assert.equal(e.state.objectWrites, 0);
});
test('Parallelaenderung wird am updatedAt abgefangen', async () => {
  const rows = allRows(); rows.find((r) => r.id === 'id-16').plz = '33611';
  const e = environment({ rows, argv: ['--ausfuehren', '--uebernehmen=16', '--felder=plz'], concurrentEdit: true });
  await e.api.main(); assert.equal(row16(e).plz, '33611'); assert.equal(row16(e).updatedAt, 'concurrent');
  assert.equal(e.state.committed, false); assert.match(e.state.jobs[0].fehlerLog, /parallel geaendert/);
});
test('Alten Schluessel unter gleicher interner ID migrieren', async () => {
  const rows = allRows(); rows.find((r) => r.id === 'id-87').externeId = 'wincasa-87';
  const e = environment({ rows, argv: ['--ausfuehren'] }); await e.api.main();
  assert.equal(e.state.rows.find((r) => r.id === 'id-87').externeId, 'wincasa-087');
  assert.equal(e.state.rows.length, 60); assert.equal(e.state.jobs[0].status, 'DONE');
});
test('Doppelter alter/neuer Schluessel sperrt alle Writes', async () => {
  const rows = allRows(); rows.push({ ...copy(rows.find((r) => r.id === 'id-87')), id: 'duplicate', externeId: 'wincasa-87' });
  const e = environment({ rows, argv: ['--ausfuehren'] }); await e.api.main();
  assert.deepEqual(e.state.rows, rows); assert.equal(e.state.objectWrites, 0);
});
