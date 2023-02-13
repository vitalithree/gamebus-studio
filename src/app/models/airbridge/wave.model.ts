export class Wave {
  id: number;
  start: Date;
  end: Date;
  isLive: boolean;

  public static from(obj: any): Wave {
    const { id = null, start = null, end = null, isLive = false, } = obj;
    return { id, start, end, isLive };
  }
}
