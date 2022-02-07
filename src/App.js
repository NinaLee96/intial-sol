import React, { useState } from "react";
import {
  Connection,
  clusterApiUrl,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import Mint from "./Mint";

const App = () => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [provider, setProvider] = useState();
  const [loading, setLoading] = useState();

  const props = {
    setLoading,
    provider,
    walletConnected,
    loading,
  };

  const getProvider = async () => {
    if ("solana" in window) {
      const provider = window.solana;
      if (provider.isPhantom) {
        return provider;
      }
    } else {
      window.open("https://www.phantom.app/", "_blank");
    }
  };

  const walletConnectionHelper = async () => {
    if (walletConnected) {
      //Disconnect Wallet
      setProvider();
      setWalletConnected(false);
    } else {
      const userWallet = await getProvider();
      if (userWallet) {
        await userWallet.connect();
        userWallet.on("connect", async () => {
          setProvider(userWallet);
          setWalletConnected(true);
        });
      }
    }
  };
  const airDropHelper = async () => {
    try {
      setLoading(true);
      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
      const fromAirDropSignature = await connection.requestAirdrop(
        new PublicKey(provider.publicKey),
        LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(fromAirDropSignature, {
        commitment: "confirmed",
      });

      console.log(
        `1 SOL airdropped to your wallet ${provider.publicKey.toString()} successfully`
      );
      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };
  return (
    <div>
      <h1>Token creation</h1>
      {walletConnected ? (
        <p>
          <strong>Public Key:</strong> {provider.publicKey.toString()}
        </p>
      ) : (
        <p></p>
      )}
      <button onClick={walletConnectionHelper} disabled={loading}>
        {!walletConnected ? "Connect Wallet" : "Disconnect Wallet"}
      </button>
      {walletConnected ? (
        <p>
          Airdrop 1 SOL into your wallet
          <button disabled={loading} onClick={airDropHelper}>
            AirDrop SOL{" "}
          </button>
        </p>
      ) : (
        <></>
      )}
      <Mint {...props} />
    </div>
  );
};

export default App;
