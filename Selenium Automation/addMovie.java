import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.*;

import java.time.Duration;

public class addMovie {

    public static void safeClick(WebDriver driver, WebElement el){
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", el);
    }

    public static void main(String[] args) throws InterruptedException {

        WebDriver driver = new ChromeDriver();
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(20));

        driver.manage().window().maximize();
        Thread.sleep(1000);

        driver.get("https://moviemania.pratham.codes/login");
        Thread.sleep(1000);

        WebElement email = wait.until(
                ExpectedConditions.elementToBeClickable(By.name("email"))
        );
        email.clear();
        Thread.sleep(1000);

        email.sendKeys("your_email_id");
        Thread.sleep(1000);

        WebElement password = wait.until(
                ExpectedConditions.elementToBeClickable(By.name("password"))
        );
        password.clear();
        Thread.sleep(1000);

        password.sendKeys("your_password");
        Thread.sleep(1000);

        WebElement loginBtn = wait.until(
                ExpectedConditions.elementToBeClickable(By.xpath("//button[@type='submit']"))
        );
        Thread.sleep(1000);

        safeClick(driver, loginBtn);
        Thread.sleep(1000);

        wait.until(d ->
                d.getCurrentUrl().contains("/dashboard")
                        || d.getPageSource().contains("Invalid")
        );
        Thread.sleep(1000);

        if (!driver.getCurrentUrl().contains("/dashboard")) {
            System.out.println("Login Failed");
            driver.quit();
            return;
        }

        System.out.println("Login Successful");
        Thread.sleep(1000);

        wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.xpath("//h1[contains(text(),'Dashboard')]")
        ));
        Thread.sleep(1000);

        WebElement addMovieBtn = wait.until(
                ExpectedConditions.elementToBeClickable(
                        By.xpath("//a[@href='/add']//button | //button[contains(.,'Add Movie')]")
                )
        );
        Thread.sleep(1000);

        safeClick(driver, addMovieBtn);
        Thread.sleep(1000);

        wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.xpath("//h1[contains(text(),'Add Movie')]")
        ));
        Thread.sleep(1000);

        WebElement searchBtn = wait.until(
                ExpectedConditions.elementToBeClickable(
                        By.xpath("//button[contains(.,'Search Movies')]")
                )
        );
        Thread.sleep(1000);

        safeClick(driver, searchBtn);
        Thread.sleep(1000);

        WebElement searchInput = wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        By.xpath("//input[@type='text' and not(@disabled)]")
                )
        );
        Thread.sleep(1000);

        searchInput.click();
        Thread.sleep(1000);

        searchInput.clear();
        Thread.sleep(1000);

        searchInput.sendKeys("Zindagi Na Milegi Dobara");
        Thread.sleep(1000);

        WebElement znmd = wait.until(
                ExpectedConditions.elementToBeClickable(
                        By.xpath("//*[contains(text(),'Zindagi Na Milegi Dobara')]")
                )
        );
        Thread.sleep(1000);

        safeClick(driver, znmd);
        Thread.sleep(1000);

        wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.xpath("//h2[contains(text(),'Add Your Review')]")
        ));
        Thread.sleep(1000);

        WebElement submit = wait.until(
                ExpectedConditions.elementToBeClickable(
                        By.xpath("//button[@type='submit']")
                )
        );
        Thread.sleep(1000);

        safeClick(driver, submit);
        Thread.sleep(1000);

        wait.until(ExpectedConditions.urlContains("/dashboard"));
        Thread.sleep(1000);

        System.out.println("Movie Added Successfully");
        Thread.sleep(1000);

        driver.quit();
    }
}
