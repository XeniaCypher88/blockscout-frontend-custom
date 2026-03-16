import { Box, Text } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import React from 'react';

import useIsMounted from 'lib/hooks/useIsMounted';
import getQueryParamString from 'lib/router/getQueryParamString';
import ActionBar from 'ui/shared/ActionBar';
import DataListDisplay from 'ui/shared/DataListDisplay';
import Pagination from 'ui/shared/pagination/Pagination';
// import Link from 'toolkit/components/Link/Link';

type CosmosAddressTxItem = {
  txhash: string;
  height: number;
  primary_type: string;
  type_label: string;
  success: boolean;
  code: number;
  gas_wanted: number | null;
  gas_used: number | null;
  fee_amount: string | null;
  fee_denom: string | null;
  memo: string | null;
  timestamp: string | null;
  inserted_at: string;
  addresses: Array<{
    address: string;
    role: string;
  }>;
};

type CosmosAddressTxResponse = {
  items: Array<CosmosAddressTxItem>;
  page: number;
  page_size: number;
  total: number;
  has_next_page: boolean;
};

type Props = {
  shouldRender?: boolean;
  isQueryEnabled?: boolean;
};

const PAGE_SIZE = 20;

const AddressCosmosTxs = ({ shouldRender = true, isQueryEnabled = true }: Props) => {
  const isMounted = useIsMounted();
  const router = useRouter();
  const hash = getQueryParamString(router.query.hash);

  const [ data, setData ] = React.useState<CosmosAddressTxResponse | null>(null);
  const [ isLoading, setIsLoading ] = React.useState(false);
  const [ isError, setIsError ] = React.useState(false);
  const [ page, setPage ] = React.useState(1);

  React.useEffect(() => {
    if (!isQueryEnabled || !hash) {
      return;
    }

    let ignore = false;

    async function load() {
      try {
        setIsLoading(true);
        setIsError(false);

        const res = await fetch(
          `/cosmos-api/addresses/${ hash }/transactions?page=${ page }&page_size=${ PAGE_SIZE }`,
        );

        if (!res.ok) {
          throw new Error(`Failed to fetch cosmos txs: ${ res.status }`);
        }

        const json = await res.json();

        if (!ignore) {
          setData(json);
        }
      } catch (_error) {
        if (!ignore) {
          setIsError(true);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [ hash, isQueryEnabled, page ]);

  const handleNextPageClick = React.useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  const handlePrevPageClick = React.useCallback(() => {
    setPage((prev) => Math.max(prev - 1, 1));
  }, []);

  if (!isMounted || !shouldRender) {
    return null;
  }

  const items = data?.items || [];

  const actionBar = (
    <ActionBar mt={ -6 } justifyContent="left">
      <Text textStyle="sm" color="text.secondary">
        Cosmos transactions
      </Text>
      <Pagination
        ml={{ base: 'auto', lg: 8 }}
        page={ page }
        pageSize={ PAGE_SIZE }
        isLoading={ isLoading }
        hasNextPage={ Boolean(data?.has_next_page) }
        canGoBack={ page > 1 }
        onNextPageClick={ handleNextPageClick }
        onPrevPageClick={ handlePrevPageClick }
      />
    </ActionBar>
  );

  const content = (
    <Box>
      { items.map((item) => (
        <Box
          key={ item.txhash }
          borderWidth="1px"
          borderRadius="md"
          p={ 4 }
          mb={ 3 }
        >
          <Text fontWeight="600" mb={ 1 }>
            { item.type_label }
          </Text>

          <Text textStyle="sm" color="text.secondary" mb={ 1 }>
            Height: { item.height }
          </Text>

          <Text textStyle="sm" color={ item.success ? 'green.500' : 'red.500' } mb={ 1 }>
            { item.success ? 'Success' : `Failed (${ item.code })` }
          </Text>

          <Text textStyle="sm" mb={ 1 }>
            Fee: { item.fee_amount || '-' } { item.fee_denom || '' }
          </Text>

          <Text textStyle="sm" mb={ 1 }>
            Time: { item.timestamp || '-' }
          </Text>

          <Text textStyle="sm" mb={ 2 } wordBreak="break-all">
            TxHash: { item.txhash }
          </Text>

          <Box>
            { item.addresses.map((addr) => (
              <Text key={ `${ item.txhash }-${ addr.role }-${ addr.address }` } textStyle="sm">
                { addr.role }: { addr.address }
              </Text>
            )) }
          </Box>
        </Box>
      )) }
    </Box>
  );

  return (
    <DataListDisplay
      isError={ isError }
      itemsNum={ items.length }
      emptyStateProps={{
        term: 'transaction',
      }}
      emptyText="There are no Cosmos transactions for this address."
      actionBar={ actionBar }
    >
      { content }
    </DataListDisplay>
  );
};

export default React.memo(AddressCosmosTxs);
