export const parseBody = async (res: Response) => {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  };