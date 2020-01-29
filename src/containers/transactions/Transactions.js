import React, { useState } from 'react';
import { orderBy } from 'lodash';
import { useSelector } from 'react-redux';
import BN from 'bn.js';
import moment from 'moment';
import truncate from 'truncate-middle';

import { selectChildchainTransactions, selectEthDeposits, selectErc20Deposits } from 'selectors/transactionSelector';
import { selectPendingExits, selectExitedExits } from 'selectors/exitSelector';

import ProcessExitsModal from 'containers/modals/ProcessExitsModal';

import Input from 'components/input/Input';
import Transaction from 'components/transaction/Transaction';
import networkService from 'services/networkService';
import config from 'util/config';

import * as styles from './Transactions.module.scss';

function Transactions () {
  const unorderedTransactions = useSelector(selectChildchainTransactions);
  const transactions = orderBy(unorderedTransactions, i => i.block.timestamp, 'desc');

  const ethDeposits = useSelector(selectEthDeposits);
  const erc20Deposits = useSelector(selectErc20Deposits);
  const allDeposits = [...ethDeposits, ...erc20Deposits];
  const deposits = orderBy(allDeposits, i => i.blockNumber, 'desc');

  const pendingExits = useSelector(selectPendingExits);
  const exitedExits = useSelector(selectExitedExits);

  const [ searchHistory, setSearchHistory ] = useState('');
  const [ processExitModal, setProcessExitModal ] = useState(false);

  function calculateOutput (utxo) {
    const total = utxo.outputs.reduce((prev, curr) => {
      if (curr.owner !== networkService.account) {
        return prev.add(new BN(curr.amount))
      }
      return prev;
    }, new BN(0));
    return `${total.toString()}`;
  }

  const _transactions = transactions.filter(i => {
    return i.txhash.includes(searchHistory);
  });
  const _deposit = deposits.filter(i => {
    return i.transactionHash.includes(searchHistory);
  });
  const _pendingExits = pendingExits.filter(i => {
    return i.transactionHash.includes(searchHistory);
  });
  const _exitedExits = exitedExits.filter(i => {
    return i.transactionHash.includes(searchHistory);
  });

  return (
    <div className={styles.container}>
      <ProcessExitsModal
        open={!!processExitModal}
        utxo={processExitModal}
        toggle={() => setProcessExitModal(false)}
      />

      <div className={styles.header}>
        <h2 className={styles.history}>History</h2>
        <Input
          icon
          placeholder='Search history'
          value={searchHistory}
          onChange={i => setSearchHistory(i.target.value)}
          className={styles.searchBar}
        />
      </div>

      <div className={styles.data}>
        <div className={styles.section}>
          <div className={styles.subTitle}>
            <span>Deposits</span>
          </div>
          <div className={styles.transactionSection}>
            <div className={styles.transactions}>
              {!_deposit.length && (
                <div className={styles.disclaimer}>No deposit history.</div>
              )}
              {_deposit.map((i, index) => {
                return (
                  <Transaction
                    key={index}
                    link={`${config.etherscanUrl}/tx/${i.transactionHash}`}
                    title={truncate(i.transactionHash, 10, 4, '...')}
                    subTitle={truncate(i.returnValues.token, 10, 4, '...')}
                    status={i.status === 'Pending' ? 'Pending' : `${i.returnValues.amount}`}
                    subStatus={`Block ${i.blockNumber}`}
                  />
                );
              })}
            </div>
          </div>

          <div className={styles.subTitle}>
            <span>Exits</span>
          </div>
          <div className={styles.transactionSection}>
            <div className={styles.transactions}>
              {(!_pendingExits.length && !_exitedExits.length) && (
                <div className={styles.disclaimer}>No exit history.</div>
              )}
              {_pendingExits.map((i, index) => {
                return (
                  <Transaction
                    key={index}
                    link={`${config.etherscanUrl}/tx/${i.transactionHash}`}
                    button={{
                      onClick: () => setProcessExitModal(i),
                      text: 'Process Exit'
                    }}
                    title={truncate(i.transactionHash, 10, 4, '...')}
                    subTitle={`Block ${i.blockNumber}`}
                  />
                );
              })}
              {_exitedExits.map((i, index) => {
                return (
                  <Transaction
                    key={index}
                    link={`${config.etherscanUrl}/tx/${i.transactionHash}`}
                    status='Exited'
                    title={truncate(i.transactionHash, 10, 4, '...')}
                    subTitle={`Block ${i.blockNumber}`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.subTitle}>
            <span>Transactions</span>
          </div>
          <div className={styles.transactions}>
            {!_transactions.length && (
              <div className={styles.disclaimer}>No transaction history.</div>
            )}
            {_transactions.map((i, index) => {
              return (
                <Transaction
                  key={index}
                  link={`${config.blockExplorerUrl}/transaction/${i.txhash}`}
                  title={truncate(i.txhash, 10, 4, '...')}
                  subTitle={moment.unix(i.block.timestamp).format('lll')}
                  status={calculateOutput(i)}
                  subStatus={`Block ${i.block.blknum}`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Transactions;
