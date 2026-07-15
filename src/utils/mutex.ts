
// 単純な非同期mutex（直列キュー）。同じMutexインスタンスに対する runExclusive は
// 互いに重ならず、投入順に1つずつ実行される。JSは単一スレッドだが、await をまたぐ
// read-modify-write は割り込まれ得るため、それを直列化して競合・二重実行を防ぐ。

export class Mutex {
  private tail: Promise<unknown> = Promise.resolve();

  runExclusive<T>(task: () => Promise<T>): Promise<T> {
    const run = this.tail.then(task, task);
    // 次の待ち行列は、成否にかかわらず今回の完了後に続く（失敗は握りつぶさず呼び出し元へ伝播）
    this.tail = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }
}
