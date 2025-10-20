export const createDrizzleMock = () => {
  const mock: any = {
    select: jest.fn(),
    from: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    offset: jest.fn(),
    innerJoin: jest.fn(),
    leftJoin: jest.fn(),
    values: jest.fn(),
    set: jest.fn(),
    returning: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    transaction: jest.fn(),
    groupBy: jest.fn(),
    query: {},
  };

  mock.select.mockReturnValue(mock);
  mock.from.mockReturnValue(mock);
  mock.where.mockReturnValue(mock);
  mock.orderBy.mockReturnValue(mock);
  mock.limit.mockReturnValue(mock);
  mock.offset.mockReturnValue(mock);
  mock.innerJoin.mockReturnValue(mock);
  mock.leftJoin.mockReturnValue(mock);
  mock.insert.mockReturnValue(mock);
  mock.values.mockReturnValue(mock);
  mock.update.mockReturnValue(mock);
  mock.set.mockReturnValue(mock);
  mock.delete.mockReturnValue(mock);
  mock.returning.mockResolvedValue([{}]); // Default mock resolved value
  mock.groupBy.mockReturnValue(mock);

  // The transaction should also return the mock for chaining
  mock.transaction.mockImplementation(async (callback) => await callback(mock));

  return mock;
};